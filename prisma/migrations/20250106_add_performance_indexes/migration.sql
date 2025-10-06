-- Add indexes for faster queries

-- Tournament queries
CREATE INDEX IF NOT EXISTS "idx_tournament_active" ON "Tournament"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_tournament_id_active" ON "Tournament"("id", "isActive");

-- Match queries - most frequently accessed
CREATE INDEX IF NOT EXISTS "idx_match_tournament" ON "Match"("tournamentId");
CREATE INDEX IF NOT EXISTS "idx_match_tournament_round" ON "Match"("tournamentId", "round");
CREATE INDEX IF NOT EXISTS "idx_match_tournament_status" ON "Match"("tournamentId", "status");
CREATE INDEX IF NOT EXISTS "idx_match_tournament_pool" ON "Match"("tournamentId", "pool");
CREATE INDEX IF NOT EXISTS "idx_match_home_player" ON "Match"("homePlayerId");
CREATE INDEX IF NOT EXISTS "idx_match_away_player" ON "Match"("awayPlayerId");

-- Player queries
CREATE INDEX IF NOT EXISTS "idx_player_tournament" ON "Player"("tournamentId");
CREATE INDEX IF NOT EXISTS "idx_player_tournament_pool" ON "Player"("tournamentId", "pool");
CREATE INDEX IF NOT EXISTS "idx_player_name" ON "Player"("name");

-- Task queries
CREATE INDEX IF NOT EXISTS "idx_task_tournament" ON "Task"("tournamentId");

-- Task Assignment queries
CREATE INDEX IF NOT EXISTS "idx_assignment_player" ON "TaskAssignment"("playerId");
CREATE INDEX IF NOT EXISTS "idx_assignment_task" ON "TaskAssignment"("taskId");
CREATE INDEX IF NOT EXISTS "idx_assignment_match" ON "TaskAssignment"("matchId");

-- Registration Link queries
CREATE INDEX IF NOT EXISTS "idx_reglink_tournament" ON "RegistrationLink"("tournamentId");
CREATE INDEX IF NOT EXISTS "idx_reglink_code" ON "RegistrationLink"("code");
