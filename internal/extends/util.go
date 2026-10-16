package extends

import (
	"math/rand/v2"
	"regexp"
	"strings"
)

var (
	nonAlnum   = regexp.MustCompile(`[^a-z0-9]+`)
	edgeDashes = regexp.MustCompile(`(^-+|-+$)`)
	charset    = "0123456789abcdefghijklmnopqrstuvwxyz"
)

func generateSlug(name string) string {
	base := strings.ToLower(name)
	base = nonAlnum.ReplaceAllString(base, "-")
	base = edgeDashes.ReplaceAllString(base, "")
	if base == "" {
		base = "game"
	}

	n := 5
	rs := make([]byte, n)
	for i := range n {
		idx := rand.IntN(len(charset))
		rs[i] = charset[idx]
	}

	return base + "-" + string(rs)
}
