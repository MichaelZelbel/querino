-- Delete team members first (foreign key constraint)
DELETE FROM team_members WHERE team_id = '7106a7f6-582b-4574-9029-dfc3ca994333';

-- Delete the team
DELETE FROM teams WHERE id = '7106a7f6-582b-4574-9029-dfc3ca994333';