package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

type TemplateTaskSeed struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Cadence     string `json:"cadence"`
	SortOrder   int    `json:"sort_order"`
}

type TemplateSeed struct {
	Name           string             `json:"name"`
	Description    string             `json:"description"`
	ImageURL       string             `json:"image_url"`
	ResetHourUTC   int                `json:"reset_hour_utc"`
	ResetMinuteUTC int                `json:"reset_minute_utc"`
	WeeklyResetDay int                `json:"weekly_reset_day"`
	Tasks          []TemplateTaskSeed `json:"tasks"`
}

func getEnvOrDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func main() {
	seedDemo := flag.Bool("seed-demo", false, "Create and seed a demo player user with sample game and tasks (default: false)")
	templatesFlag := flag.String("templates", "", "Path to templates JSON file (defaults to TEMPLATES_FILE env or data/templates.json)")
	flag.Parse()

	templatesFilePath := *templatesFlag
	if templatesFilePath == "" {
		templatesFilePath = getEnvOrDefault("TEMPLATES_FILE", "data/templates.json")
	}

	adminUsername := getEnvOrDefault("ADMIN_USERNAME", "admin")
	adminEmail := getEnvOrDefault("ADMIN_EMAIL", "admin@example.com")
	adminPassword := getEnvOrDefault("ADMIN_PASSWORD", "admin123456")

	app := pocketbase.New()

	if err := app.Bootstrap(); err != nil {
		log.Fatalf("Failed to bootstrap app: %v", err)
	}

	fmt.Println("Starting database seeding...")

	usersCol, err := app.FindCollectionByNameOrId("users")
	if err != nil {
		log.Fatalf("Users collection not found: %v", err)
	}

	// 2. Seed Admin User
	existingAdmin, _ := app.FindFirstRecordByData("users", "username", adminUsername)
	if existingAdmin == nil {
		adminRec := core.NewRecord(usersCol)
		adminRec.Set("username", adminUsername)
		adminRec.Set("email", adminEmail)
		adminRec.SetPassword(adminPassword)
		adminRec.Set("role", "admin")
		if err := app.Save(adminRec); err != nil {
			log.Fatalf("Failed to create admin user: %v", err)
		}
		fmt.Printf("Created admin user '%s'\n", adminUsername)
	} else {
		fmt.Printf("Admin user '%s' already exists\n", adminUsername)
	}

	// 3. Load and Seed Game Templates from JSON
	fileData, err := os.ReadFile(templatesFilePath)
	if err != nil {
		log.Fatalf("Failed to read templates file '%s': %v", templatesFilePath, err)
	}

	var templates []TemplateSeed
	if err := json.Unmarshal(fileData, &templates); err != nil {
		log.Fatalf("Failed to parse templates JSON: %v", err)
	}

	templatesCol, err := app.FindCollectionByNameOrId("game_templates")
	if err != nil {
		log.Fatalf("game_templates collection not found: %v", err)
	}
	templateTasksCol, err := app.FindCollectionByNameOrId("template_tasks")
	if err != nil {
		log.Fatalf("template_tasks collection not found: %v", err)
	}

	var firstTemplateRecord *core.Record

	for _, tmpl := range templates {
		existing, _ := app.FindFirstRecordByData("game_templates", "name", tmpl.Name)
		if existing != nil {
			fmt.Printf("Template '%s' already exists\n", tmpl.Name)
			if firstTemplateRecord == nil {
				firstTemplateRecord = existing
			}
			continue
		}

		tRecord := core.NewRecord(templatesCol)
		tRecord.Set("name", tmpl.Name)
		tRecord.Set("description", tmpl.Description)
		tRecord.Set("image_url", tmpl.ImageURL)
		tRecord.Set("reset_hour_utc", tmpl.ResetHourUTC)
		tRecord.Set("reset_minute_utc", tmpl.ResetMinuteUTC)
		tRecord.Set("weekly_reset_day", tmpl.WeeklyResetDay)
		tRecord.Set("is_official", true)

		if err := app.Save(tRecord); err != nil {
			log.Fatalf("Failed to save template '%s': %v", tmpl.Name, err)
		}

		if firstTemplateRecord == nil {
			firstTemplateRecord = tRecord
		}

		for _, task := range tmpl.Tasks {
			taskRecord := core.NewRecord(templateTasksCol)
			taskRecord.Set("template_id", tRecord.Id)
			taskRecord.Set("title", task.Title)
			taskRecord.Set("description", task.Description)
			taskRecord.Set("cadence", task.Cadence)
			taskRecord.Set("sort_order", task.SortOrder)
			if err := app.Save(taskRecord); err != nil {
				log.Fatalf("Failed to save template task '%s': %v", task.Title, err)
			}
		}

		fmt.Printf("Created game template '%s' with %d tasks\n", tmpl.Name, len(tmpl.Tasks))
	}

	// 4. Optionally Seed Demo Player User & Game
	if *seedDemo {
		playerUsername := getEnvOrDefault("PLAYER_USERNAME", "player")
		playerPassword := getEnvOrDefault("PLAYER_PASSWORD", "player123456")

		playerUser, _ := app.FindFirstRecordByData("users", "username", playerUsername)
		if playerUser == nil {
			playerUser = core.NewRecord(usersCol)
			playerUser.Set("username", playerUsername)
			playerUser.SetPassword(playerPassword)
			playerUser.Set("role", "user")
			if err := app.Save(playerUser); err != nil {
				log.Fatalf("Failed to create player user: %v", err)
			}
			fmt.Printf("Created demo player user '%s'\n", playerUsername)
		} else {
			fmt.Printf("Demo player user '%s' already exists\n", playerUsername)
		}

		userGamesCol, err := app.FindCollectionByNameOrId("user_games")
		if err == nil && playerUser != nil && firstTemplateRecord != nil {
			existingUserGame, _ := app.FindFirstRecordByData("user_games", "user", playerUser.Id)
			if existingUserGame == nil {
				userGame := core.NewRecord(userGamesCol)
				userGame.Set("user", playerUser.Id)
				userGame.Set("name", firstTemplateRecord.GetString("name"))
				userGame.Set("image_url", firstTemplateRecord.GetString("image_url"))
				userGame.Set("reset_hour_utc", firstTemplateRecord.GetInt("reset_hour_utc"))
				userGame.Set("reset_minute_utc", firstTemplateRecord.GetInt("reset_minute_utc"))
				userGame.Set("weekly_reset_day", firstTemplateRecord.GetInt("weekly_reset_day"))
				userGame.Set("is_public", true)
				userGame.Set("share_slug", "ffxiv-demo")
				userGame.Set("sort_order", 1)

				if err := app.Save(userGame); err == nil {
					fmt.Println("Created demo game for player: FFXIV")

					tasksCol, _ := app.FindCollectionByNameOrId("tasks")
					if tasksCol != nil {
						demoTasks := []struct {
							Title   string
							Cadence string
						}{
							{"Expert Roulette", "daily"},
							{"Leveling Roulette", "daily"},
							{"Frontline PVP", "daily"},
							{"Savage Raid Clears", "weekly"},
							{"Custom Deliveries", "weekly"},
						}
						for i, dt := range demoTasks {
							tr := core.NewRecord(tasksCol)
							tr.Set("user_game", userGame.Id)
							tr.Set("user", playerUser.Id)
							tr.Set("title", dt.Title)
							tr.Set("cadence", dt.Cadence)
							tr.Set("sort_order", i+1)
							app.Save(tr)
						}
					}

					todosCol, _ := app.FindCollectionByNameOrId("todos")
					if todosCol != nil {
						demoTodos := []struct {
							Title string
							Notes string
						}{
							{"Farm 1000 Allagan Tomestones", "Needed for crafted gear pentameld"},
							{"Clear M4S Savage", "Watch guide for phase 2 sunrise mechanics"},
						}
						for i, dtodo := range demoTodos {
							tdr := core.NewRecord(todosCol)
							tdr.Set("user", playerUser.Id)
							tdr.Set("user_game", userGame.Id)
							tdr.Set("title", dtodo.Title)
							tdr.Set("notes", dtodo.Notes)
							tdr.Set("completed", false)
							tdr.Set("due_date", time.Now().AddDate(0, 0, 7))
							tdr.Set("sort_order", i+1)
							app.Save(tdr)
						}
					}
				}
			}
		}
	} else {
		fmt.Println("Skipping demo player creation (use --seed-demo to enable)")
	}

	fmt.Println("Database seeding completed successfully!")
}
