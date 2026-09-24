CREATE TABLE rooms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  grid_x INTEGER NOT NULL,
  grid_y INTEGER NOT NULL,
  UNIQUE (grid_x, grid_y)
);

INSERT INTO rooms (id, name, description, grid_x, grid_y) VALUES
  ('stair', 'Spiral Stair', 'An iron staircase curls around a stone column, its steps dusted with salt. Warm light spills through the eastern doorway, while the smell of cold tea drifts up from the kitchen to the south.', 0, 0),
  ('lamp', 'Lamp Room', 'A great glass lens turns slowly, casting a golden beam across the dark sea. The Spiral Stair waits to the west, and an iron ladder leads south down to the rocks.', 1, 0),
  ('kitchen', 'Keeper''s Kitchen', 'A chipped mug and an open logbook sit on a wooden table beside a cold stove. The Spiral Stair rises to the north, and the eastern door opens onto the wet rocks.', 0, 1),
  ('rocks', 'Rocks', 'Black rocks glisten beneath your feet as white waves break against the lighthouse. A narrow iron ladder climbs north to the Lamp Room, and a weathered kitchen door stands to the west.', 1, 1);
