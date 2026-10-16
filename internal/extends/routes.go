package extends

import (
	"io/fs"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

func SetupRoutes(pb *pocketbase.PocketBase, frontendFS fs.FS) func(*core.ServeEvent) error {
	app := App{app: pb}

	return func(se *core.ServeEvent) error {
		se.Router.POST("/api/dailies/user_games/{slug}/clone", app.cloneUserGame).Bind(apis.RequireAuth())
		se.Router.GET("/{path...}", apis.Static(frontendFS, true))
		return se.Next()
	}
}
