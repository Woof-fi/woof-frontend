# 🐶 Woof - Dog-Centric Social Network

A social network and local discovery platform where **dogs are the main users**, not humans.

## Quick Start

### View the Prototype
```bash
cd src
open index.html
```

Or use a local server:
```bash
cd src
python3 -m http.server 8000
# Then open http://localhost:8000
```

## What is Woof?

Woof combines:
- 🐕 **Dog profiles** - Dogs have their own identity and social presence
- 📍 **Territory-based discovery** - Find dogs and activities in your local area
- 🗺️ **Maps & places** - Real-world locations dogs visit
- 🛍️ **Pet marketplace** - Buy/sell pet products and services
- 💬 **Social feed** - Share updates, photos, and connect with other dogs

## Current Status

**Phase:** Frontend Prototype ✅

This is a fully navigable static frontend that demonstrates the complete product vision.

### What Works Now
- Home feed with dog posts
- Dog profile pages (public + private sections)
- Territory maps with local activity
- Marketplace with products
- Responsive navigation (mobile + desktop)
- UI interactions (likes, tabs, modals)

### What's Next
- Backend infrastructure
- User authentication
- Database integration
- Real messaging system
- Payment processing
- Content moderation

See [docs/roadmap.md](docs/roadmap.md) for detailed next steps.

## Project Structure

```
Woof/
├── .claude              # Claude Code context
├── README.md            # This file
├── docs/                # Documentation
│   ├── woof.md          # Comprehensive product & technical docs
│   └── roadmap.md       # Development roadmap
└── src/                 # Source code
    ├── index.html       # Home feed
    ├── map.html         # Territory map
    ├── nelli.html       # Dog profile example
    ├── store.html       # Marketplace
    ├── styles.css       # Global styles
    ├── script.js        # UI logic
    └── images/          # Assets
```

## Core Concepts

### 1. Dog-First Identity
Unlike other pet platforms, Woof treats dogs as the primary users. Dogs have profiles, friends, achievements, and social presence.

### 2. Territories
Location-based discovery organized around territories (parks, neighborhoods). Each territory has:
- Dogs currently there
- Local activities and events
- Nearby services (vets, groomers, trainers)
- Connected territories

### 3. Real-World Connections
Woof focuses on actual meetups and places, not just online interaction. The map is a core feature, not an afterthought.

## Tech Stack

### Current
- HTML5 / CSS3 / Vanilla JavaScript
- Google Maps JavaScript API
- Font Awesome icons

### Future (TBD)
Backend stack to be determined. Options being considered:
- Node.js / Express
- Python / Django or Flask
- Ruby / Rails
- Or others...

## Documentation

- [woof.md](docs/woof.md) - Complete product, business & technical documentation
- [roadmap.md](docs/roadmap.md) - Development roadmap and next steps

## Design Principles

1. **Dog-first** - Features make sense from a dog's perspective
2. **Territory-based** - Location is a first-class concept
3. **Mobile parity** - Mobile UX equals desktop
4. **Real-world focus** - Encourage actual meetups and activities
5. **Community-driven** - Enable dog owner communities

## Contributing

This is a personal project, but ideas and feedback welcome!

## License

Personal project - not open source (yet?)

---

**Note:** Woof is a personal side project by Tommi, separate from work at Oikotie.
