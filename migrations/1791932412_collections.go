package migrations

import (
	"log"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/tools/types"
)

const (
	adminRule      string = "@request.auth.role = 'admin'"
	ownerRule      string = "user = @request.auth.id"
	publicRule     string = "is_public = true"
	publicGameRule string = "user_game.is_public = true"
)

func init() {
	m.Register(func(app core.App) error {
		// Add 'role' field and make email optional on 'users' auth collection
		usersCol, err := app.FindCollectionByNameOrId("users")
		if err != nil {
			return err
		}

		if usersCol.Fields.GetByName("username") == nil {
			usersCol.Fields.Add(&core.TextField{
				Name:     "username",
				Required: true,
			})
			usersCol.AddIndex("idx_users_username", true, "username", "")
		}

		if usersCol.Fields.GetByName("role") == nil {
			usersCol.Fields.Add(&core.SelectField{
				Name:      "role",
				Values:    []string{"user", "admin"},
				MaxSelect: 1,
			})
		}

		if ef, ok := usersCol.Fields.GetByName("email").(*core.EmailField); ok {
			ef.Required = false
		}
		usersCol.PasswordAuth.IdentityFields = []string{"username"}

		if err := app.Save(usersCol); err != nil {
			log.Printf("Error configuring users collection: %v", err)
			return err
		}

		// game_templates: public repository managed by admin
		templatesCol, err := app.FindCollectionByNameOrId("game_templates")
		if err != nil {
			templatesCol = core.NewBaseCollection("game_templates")
			templatesCol.ListRule = types.Pointer("")
			templatesCol.ViewRule = types.Pointer("")
			templatesCol.CreateRule = types.Pointer(adminRule)
			templatesCol.UpdateRule = types.Pointer(adminRule)
			templatesCol.DeleteRule = types.Pointer(adminRule)

			templatesCol.Fields.Add(
				&core.TextField{Name: "name", Required: true},
				&core.FileField{
					Name:      "image",
					MaxSelect: 1,
					MaxSize:   5242880,
					MimeTypes: []string{"image/jpeg", "image/png", "image/webp", "image/gif"},
				},
				&core.URLField{Name: "image_url"},
				&core.TextField{Name: "description"},
				&core.NumberField{
					Name:    "reset_hour_utc",
					Min:     types.Pointer(0.0),
					Max:     types.Pointer(23.0),
					OnlyInt: true,
				},
				&core.NumberField{
					Name:    "reset_minute_utc",
					Min:     types.Pointer(0.0),
					Max:     types.Pointer(59.0),
					OnlyInt: true,
				},
				&core.NumberField{
					Name:    "weekly_reset_day",
					Min:     types.Pointer(0.0),
					Max:     types.Pointer(6.0),
					OnlyInt: true,
				},
			)

			if err := app.Save(templatesCol); err != nil {
				return err
			}
		}

		// template_tasks: default tasks for a game template
		templateTasksCol, err := app.FindCollectionByNameOrId("template_tasks")
		if err != nil {
			templateTasksCol = core.NewBaseCollection("template_tasks")
			templateTasksCol.ListRule = types.Pointer("")
			templateTasksCol.ViewRule = types.Pointer("")
			templateTasksCol.CreateRule = types.Pointer(adminRule)
			templateTasksCol.UpdateRule = types.Pointer(adminRule)
			templateTasksCol.DeleteRule = types.Pointer(adminRule)

			templateTasksCol.Fields.Add(
				&core.RelationField{
					Name:          "template_id",
					CollectionId:  templatesCol.Id,
					CascadeDelete: true,
					Required:      true,
					MaxSelect:     1,
				},
				&core.TextField{Name: "title", Required: true},
				&core.TextField{Name: "description"},
				&core.SelectField{
					Name:      "cadence",
					Values:    []string{"daily", "weekly"},
					MaxSelect: 1,
					Required:  true,
				},
				&core.NumberField{Name: "sort_order"},
			)

			if err := app.Save(templateTasksCol); err != nil {
				return err
			}
		}

		// user_games: user's personal tracker games
		userGamesCol, err := app.FindCollectionByNameOrId("user_games")
		if err != nil {
			userGamesCol = core.NewBaseCollection("user_games")
			userGamesCol.ListRule = types.Pointer(rulesOR(ownerRule, publicRule))
			userGamesCol.ViewRule = types.Pointer(rulesOR(ownerRule, publicRule))
			userGamesCol.CreateRule = types.Pointer("@request.auth.id != ''")
			userGamesCol.UpdateRule = types.Pointer(ownerRule)
			userGamesCol.DeleteRule = types.Pointer(ownerRule)

			userGamesCol.Fields.Add(
				&core.RelationField{
					Name:          "user",
					CollectionId:  usersCol.Id,
					CascadeDelete: true,
					Required:      true,
					MaxSelect:     1,
				},
				&core.TextField{Name: "name", Required: true},
				&core.FileField{
					Name:      "image",
					MaxSelect: 1,
					MaxSize:   5242880,
					MimeTypes: []string{"image/jpeg", "image/png", "image/webp", "image/gif"},
				},
				&core.URLField{Name: "image_url"},
				&core.NumberField{
					Name:    "reset_hour_utc",
					Min:     types.Pointer(0.0),
					Max:     types.Pointer(23.0),
					OnlyInt: true,
				},
				&core.NumberField{
					Name:    "reset_minute_utc",
					Min:     types.Pointer(0.0),
					Max:     types.Pointer(59.0),
					OnlyInt: true,
				},
				&core.NumberField{
					Name:    "weekly_reset_day",
					Min:     types.Pointer(0.0),
					Max:     types.Pointer(6.0),
					OnlyInt: true,
				},
				&core.BoolField{Name: "is_public"},
				&core.TextField{Name: "share_slug", Required: true},
				&core.NumberField{Name: "sort_order"},
			)

			userGamesCol.AddIndex("idx_user_games_share_slug", true, "share_slug", "")

			if err := app.Save(userGamesCol); err != nil {
				return err
			}
		}

		// tasks: tasks for a user's game
		tasksCol, err := app.FindCollectionByNameOrId("tasks")
		if err != nil {
			tasksCol = core.NewBaseCollection("tasks")
			tasksCol.ListRule = types.Pointer(rulesOR(ownerRule, publicGameRule))
			tasksCol.ViewRule = types.Pointer(rulesOR(ownerRule, publicGameRule))
			tasksCol.CreateRule = types.Pointer(ownerRule)
			tasksCol.UpdateRule = types.Pointer(ownerRule)
			tasksCol.DeleteRule = types.Pointer(ownerRule)

			tasksCol.Fields.Add(
				&core.RelationField{
					Name:          "user_game",
					CollectionId:  userGamesCol.Id,
					CascadeDelete: true,
					Required:      true,
					MaxSelect:     1,
				},
				&core.RelationField{
					Name:          "user",
					CollectionId:  usersCol.Id,
					CascadeDelete: true,
					Required:      true,
					MaxSelect:     1,
				},
				&core.TextField{Name: "title", Required: true},
				&core.TextField{Name: "description"},
				&core.SelectField{
					Name:      "cadence",
					Values:    []string{"daily", "weekly"},
					MaxSelect: 1,
					Required:  true,
				},
				&core.DateField{Name: "last_completed_at"},
				&core.NumberField{Name: "sort_order"},
			)

			if err := app.Save(tasksCol); err != nil {
				return err
			}
		}

		// todos: major tasks for a given user and game
		todosCol, err := app.FindCollectionByNameOrId("todos")
		if err != nil {
			todosCol = core.NewBaseCollection("todos")
			todosCol.ListRule = types.Pointer(rulesOR(ownerRule, publicGameRule))
			todosCol.ViewRule = types.Pointer(rulesOR(ownerRule, publicGameRule))
			todosCol.CreateRule = types.Pointer(ownerRule)
			todosCol.UpdateRule = types.Pointer(ownerRule)
			todosCol.DeleteRule = types.Pointer(ownerRule)

			todosCol.Fields.Add(
				&core.RelationField{
					Name:          "user",
					CollectionId:  usersCol.Id,
					CascadeDelete: true,
					Required:      true,
					MaxSelect:     1,
				},
				&core.RelationField{
					Name:          "user_game",
					CollectionId:  userGamesCol.Id,
					CascadeDelete: true,
					Required:      true,
					MaxSelect:     1,
				},
				&core.TextField{Name: "title", Required: true},
				&core.TextField{Name: "notes"},
				&core.BoolField{Name: "completed"},
				&core.NumberField{Name: "sort_order"},
			)

			if err := app.Save(todosCol); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		// Down migration
		for _, name := range []string{"todos", "tasks", "user_games", "template_tasks", "game_templates"} {
			if col, err := app.FindCollectionByNameOrId(name); err == nil {
				if err := app.Delete(col); err != nil {
					return err
				}
			}
		}
		return nil
	})
}
