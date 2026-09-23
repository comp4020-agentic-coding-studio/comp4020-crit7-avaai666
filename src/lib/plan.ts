import { openPlanStore } from "./plan-store";

// The class picker's one store, opened once against the same DATABASE_PATH
// file src/lib/db.ts opens the guestbook's table against (see plan-store.ts's
// own doc comment: production opens this factory once, against the shared
// volume file).
const path = process.env.DATABASE_PATH ?? "./.data/app.db";

export const planStore = openPlanStore(path);
