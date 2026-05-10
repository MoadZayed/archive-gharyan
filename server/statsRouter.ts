import { router, publicProcedure } from "./_core/trpc";
import { getTopStudents } from "./db";

export const statsRouter = router({
  getLeaderboard: publicProcedure.query(async () => {
    return await getTopStudents(10);
  }),
});
