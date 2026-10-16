package extends

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type App struct {
	app *pocketbase.PocketBase
}

func (a *App) cloneUserGame(e *core.RequestEvent) error {
	slug := e.Request.PathValue("slug")

	sourceGame, err := a.app.FindFirstRecordByFilter("user_games",
		"share_slug = {:slug} && (user = {:uid} || is_public = true)",
		dbx.Params{"slug": slug, "uid": e.Auth.Id})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return e.NotFoundError("User game not found.", err)
		}
		return e.InternalServerError("", err)
	}

	gameCount, err := a.app.CountRecords("user_games", dbx.HashExp{"user": e.Auth.Id})
	if err != nil {
		return e.InternalServerError("", err)
	}

	errs := a.app.ExpandRecord(sourceGame, []string{"tasks_via_user_game", "todos_via_user_game"}, nil)
	if len(errs) != 0 {
		return e.InternalServerError("", errs)
	}

	var clonedGame *core.Record

	err = a.app.RunInTransaction(func(txApp core.App) error {
		newGame := sourceGame.Fresh()
		newGame.MarkAsNew()
		newGame.Set("id", "")
		newGame.Set("user", e.Auth.Id)
		newGame.Set("is_public", false)
		newGame.Set("sort_order", gameCount+1)
		newGame.Set("share_slug", generateSlug(newGame.GetString("name")))
		if err := txApp.Save(newGame); err != nil {
			return err
		}
		clonedGame = newGame

		for _, task := range sourceGame.ExpandedAll("tasks_via_user_game") {
			newTask := task.Fresh()
			newTask.MarkAsNew()
			newTask.Set("id", "")
			newTask.Set("user_game", newGame.Id)
			newTask.Set("user", e.Auth.Id)
			newTask.Set("last_completed_at", "")
			if err := txApp.Save(newTask); err != nil {
				return err
			}
		}

		for _, todo := range sourceGame.ExpandedAll("todos_via_user_game") {
			newTodo := todo.Fresh()
			newTodo.MarkAsNew()
			newTodo.Set("id", "")
			newTodo.Set("user_game", newGame.Id)
			newTodo.Set("user", e.Auth.Id)
			newTodo.Set("completed", false)
			if err := txApp.Save(newTodo); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return e.InternalServerError("", err)
	}

	return e.JSON(http.StatusOK, clonedGame)
}
