package migrations

import "fmt"

func rulesOR(r1, r2 string) string {
	return fmt.Sprintf("(%s) || (%s)", r1, r2)
}

func rulesAND(r1, r2 string) string {
	return fmt.Sprintf("(%s) && (%s)", r1, r2)
}
