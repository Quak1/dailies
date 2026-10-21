package main

import (
	"embed"
	"io/fs"
	"log"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"

	"github.com/Quak1/dailies/internal/extends"
	_ "github.com/Quak1/dailies/migrations"
)

//go:embed dist
var frontendFS embed.FS

func main() {
	flatFS, err := fs.Sub(frontendFS, "dist")
	if err != nil {
		panic(err)
	}

	app := pocketbase.New()

	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		Automigrate: true,
	})

	app.OnServe().BindFunc(extends.SetupRoutes(app, flatFS))

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
