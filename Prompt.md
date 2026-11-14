# MASTER DEVELOPMENT PROMPT: MISSIONFORGE

You are a senior full-stack engineer, 3D graphics developer, simulation engineer and product designer.

Your task is to design and implement a complete, production-quality web application named MISSIONFORGE.

Read `design.md` completely before beginning implementation. Treat it as the primary product specification.

## 1. PROJECT OBJECTIVE

Build an interactive 3D space mission design and simulation game.

Users must be able to:

- Explore an interactive 3D solar system.
- Select planetary destinations.
- Plan scientific missions.
- Design and customize spacecraft.
- Manage mass, power, fuel and budget.
- Select launch vehicles.
- Inspect orbital trajectories.
- Launch spacecraft.
- Simulate mission operations.
- Experience engineering challenges.
- Collect scientific objectives.
- Generate mission evaluation reports.

This must be a functional application, not a static UI prototype.

## 2. NON-NEGOTIABLE TECHNOLOGY STACK

Use:

- React.
- TypeScript.
- Vite.
- Three.js.
- React Three Fiber.
- Drei.
- Tailwind CSS.
- Zustand.
- Framer Motion.
- Recharts.
- Lucide React.

Do not use Rust.

Do not replace React Three Fiber with a different rendering framework.

Do not introduce unnecessary backend infrastructure.

All core game logic must run in the browser.

Use local browser persistence for mission saves and settings.

## 3. DESIGN DIRECTION

Create a premium, cinematic, dark space mission-control interface.

Visual references should evoke sophisticated scientific visualization software and modern aerospace mission-control systems.

The interface must be:

- Minimal.
- Technical.
- Immersive.
- Professional.
- Information-rich without being cluttered.
- Responsive.

Use the exact design tokens and color palette specified in design.md.

Avoid:
- Generic SaaS dashboard appearance.
- Cartoon graphics.
- Excessive gradients.
- Excessive glassmorphism.
- Oversized rounded cards.
- Unnecessary decorative elements.
- Emoji-based interface icons.
- Fake charts containing meaningless data.

Use Lucide icons.

Use subtle Framer Motion animations.

Maintain a consistent spacing and typography system.

## 4. CORE APPLICATION EXPERIENCE

Implement the following screens.

### Screen 1: Mission Control

Create the primary dashboard.

Include:
- Welcome and mission status.
- New mission button.
- Continue mission button.
- Destination overview.
- Resource overview.
- Recent mission events.
- Scientific objective progress.

### Screen 2: Solar System Navigator

Build a real interactive 3D scene using React Three Fiber.

Include the Sun and all eight planets.

Features:
- Orbit controls.
- Camera zoom.
- Planet selection.
- Planet labels.
- Planet information panels.
- Orbital visualization.
- Destination highlighting.
- Spacecraft trajectory visualization.

Use procedural materials and geometry where external assets are unavailable.

Use realistic-looking planet textures where suitable licensed assets are available.

Do not use broken image URLs or rely on external assets without fallbacks.

Clearly label any visual scale distortions.

### Screen 3: Mission Planner

Create a guided mission configuration workflow.

Players should select:
- Mission name.
- Destination.
- Scientific objectives.
- Mission duration.
- Budget.

### Screen 4: Spacecraft Laboratory

Build an interactive spacecraft configurator.

Create a visually convincing modular 3D spacecraft.

Players must be able to add, remove and configure components.

Display live:
- Total mass.
- Fuel.
- Power generation.
- Power consumption.
- Power margin.
- Estimated cost.
- Scientific capability.

The spacecraft 3D preview must update when components change.

Use actual configuration data rather than hardcoded display values.

### Screen 5: Launch Vehicle Selection

Create a catalogue of launch vehicle options.

Display their capacities, costs and limitations.

Use a data-driven catalogue.

Never fabricate real-world specifications.

If illustrative values are used, label them clearly as fictional gameplay data.

### Screen 6: Orbital Planning

Create a 3D orbital planning interface.

Show:
- Origin.
- Destination.
- Current planetary positions.
- Planned trajectory.
- Estimated transfer time.
- Delta-v.
- Propellant requirements.

Implement a documented simplified orbital transfer model first.

Avoid presenting arbitrary planet distances or travel times as real mission predictions.

### Screen 7: Mission Simulation

Create an interactive simulation environment.

Implement:
- Mission state machine.
- Simulation clock.
- Play and pause.
- Adjustable simulation speed.
- Mission timeline.
- Flight telemetry.
- Mission events.
- Resource consumption.
- Arrival and completion conditions.

Mission events must respond to the player's actual spacecraft configuration.

### Screen 8: Mission Report

Create a polished final evaluation screen.

Display:
- Mission outcome.
- Objectives completed.
- Engineering score.
- Budget efficiency.
- Resource performance.
- Failures and recovery decisions.
- Scientific findings.
- Improvement recommendations.

Provide an option to export the report as JSON or a printable report.

## 5. SIMULATION ENGINE

Keep simulation logic independent from UI components.

Create separate TypeScript modules for:

- Orbital mechanics.
- Propulsion.
- Power generation and consumption.
- Battery state.
- Communication.
- Thermal management.
- Resource consumption.
- Mission events.
- Scoring.

Use deterministic calculations wherever possible.

Make the underlying formulas and assumptions understandable.

Implement unit tests for critical engineering calculations.

Use SI units internally where applicable.

Do not mix visual scene scale with physical simulation units.

## 6. STATE MANAGEMENT

Use Zustand.

Create separate stores for:

- Mission configuration.
- Spacecraft configuration.
- Simulation state.
- Application settings.

Persist:
- Mission configurations.
- Selected components.
- Mission progress.
- Completed missions.
- User settings.

Use versioned local persistence and handle corrupted or outdated saves safely.

Do not require authentication.

## 7. CODE QUALITY

Follow these rules:

- Strict TypeScript.
- Reusable components.
- Modular architecture.
- Clear naming.
- Consistent formatting.
- No unnecessary dependencies.
- No massive monolithic components.
- No duplicated business logic.
- No fake interactions.
- No dead buttons.
- No placeholder pages presented as complete features.

Create loading, empty, error and success states.

Ensure keyboard accessibility for important controls.

## 8. PERFORMANCE

Optimize for modern desktop browsers and lower-powered laptops.

Include:
- Adaptive device pixel ratio.
- Graphics quality settings.
- Optimized geometry.
- Compressed textures.
- Lazy-loaded assets.
- Efficient state updates.
- Reduced unnecessary rendering.
- Responsive layouts.

Handle missing WebGL support gracefully.

Do not allow a complex 3D scene to make the entire interface unusable.

## 9. DEVELOPMENT WORKFLOW

First inspect the existing repository.

If no project exists, initialize it using the specified technology stack.

Then:

1. Create the project structure.
2. Install dependencies.
3. Implement the global design system.
4. Build application navigation.
5. Implement the 3D solar system.
6. Implement mission planning.
7. Implement spacecraft customization.
8. Implement engineering calculations.
9. Implement orbital planning.
10. Implement mission simulation.
11. Implement telemetry and events.
12. Implement mission evaluation.
13. Implement local persistence.
14. Add responsive layouts.
15. Test and optimize.

Work incrementally.

Do not stop after generating a plan.

Do not only generate a homepage.

Implement the actual application.

After each major module:
- Check TypeScript errors.
- Run relevant tests.
- Fix broken imports.
- Verify that controls work.
- Verify that state updates correctly.

Before completion, run:

npm run build

Run the test suite if configured.

Resolve all build errors.

## 10. IMPLEMENTATION PRIORITIES

Prioritize a complete playable experience over decorative complexity.

First achieve:

1. Working solar system.
2. Working planetary selection.
3. Working spacecraft configuration.
4. Working engineering calculations.
5. Working mission launch.
6. Working simulation clock.
7. Working mission completion.
8. Working mission report.

Then improve 3D visual quality, animations and additional features.

## 11. SCIENTIFIC INTEGRITY

This project is intended for NASA Space Apps Challenge participation.

Treat scientific accuracy seriously.

Use traceable scientific data and references when possible.

Clearly distinguish:
- Actual scientific data.
- Simplified educational calculations.
- Fictional gameplay values.

Do not claim NASA endorsement.

Do not invent NASA partnerships or official NASA data integration.

Do not misrepresent simplified simulation results as operational mission predictions.

## 12. FINAL DELIVERY

Deliver:

- Complete working source code.
- Organized project structure.
- README.md.
- design.md.
- Installation instructions.
- Development instructions.
- Production build instructions.
- Explanation of simulation assumptions.
- Testing results.
- Deployment instructions.

The finished product must be a playable browser-based 3D space mission simulator.

## FINAL INSTRUCTION

Think like an aerospace software team building an educational simulation product.

Prioritize functionality, visual quality, scientific transparency and user experience.

Do not compromise the core mission-design gameplay to make the application look like a generic dashboard.

Build MISSIONFORGE as a complete, coherent and impressive product.
