-- The test copy's content (harness/test-copy.sh). Everything here is made up.
-- It runs once, after the migrations and after the four accounts in
-- accounts.json were created through the copy's own sign-in service, as the
-- local superuser, in one transaction. The ids are fixed so a check can name a
-- page: /prompt-kits/launch-week-prompt-kit, /collections/0b000000-0000-4000-a000-000000000501.

begin;

-- ── The accounts' ages and roles ───────────────────────────────────────────
-- An account younger than seven days is limited in what it may link (ticket
-- 8), so the established accounts are dated back; test-new-author keeps the
-- date it was created today.

update auth.users set created_at = '2026-01-01T09:00:00Z' where id = '0a000000-0000-4000-a000-000000000001';
update auth.users set created_at = '2026-02-01T09:00:00Z' where id = '0a000000-0000-4000-a000-000000000003';
update auth.users set created_at = '2026-01-01T09:00:00Z' where id = '0a000000-0000-4000-a000-000000000004';

update public.profiles set
  created_at = '2026-01-01T09:00:00Z',
  bio = 'Writes prompts for meetings, code review and research. A made-up account of the test copy.',
  website = 'https://example.com',
  github = 'test-author'
where id = '0a000000-0000-4000-a000-000000000001';

update public.profiles set created_at = '2026-02-01T09:00:00Z'
where id = '0a000000-0000-4000-a000-000000000003';

update public.profiles set created_at = '2026-01-01T09:00:00Z', role = 'admin'
where id = '0a000000-0000-4000-a000-000000000004';
update public.user_roles set role = 'admin'
where user_id = '0a000000-0000-4000-a000-000000000004';

-- ── test-author: three public prompts and one private ──────────────────────

insert into public.prompts (id, author_id, title, slug, description, content, category, tags, is_public, published_at, created_at, updated_at) values
('0b000000-0000-4000-a000-000000000101', '0a000000-0000-4000-a000-000000000001',
 'Summarise a meeting transcript', 'summarise-a-meeting-transcript',
 'Turns a long meeting transcript into decisions, owners and open questions.',
 E'You are a careful note taker. Read the meeting transcript below and write:\n\n1. The decisions that were made, one line each.\n2. Every task with its owner and due date.\n3. The questions nobody answered.\n\nKeep the speakers'' own words for anything that was promised.\n\nTranscript:\n{{transcript}}',
 'business', '{meetings,summary,notes}', true, '2026-01-02T10:00:00Z', '2026-01-02T10:00:00Z', '2026-01-02T10:00:00Z'),
('0b000000-0000-4000-a000-000000000102', '0a000000-0000-4000-a000-000000000001',
 'Explain a code diff to a reviewer', 'explain-a-code-diff-to-a-reviewer',
 'Writes the reviewer''s guide to a diff: what changed, why, and where to look first.',
 E'Here is a diff. Explain it to a reviewer who has not seen the ticket.\n\n- Start with the one sentence that says what changes for a user.\n- List the files in the order a reviewer should read them.\n- Name every behaviour that could break, and the test that covers it.\n\nDiff:\n{{diff}}',
 'coding', '{code-review,git}', true, '2026-01-03T10:00:00Z', '2026-01-03T10:00:00Z', '2026-01-03T10:00:00Z'),
('0b000000-0000-4000-a000-000000000103', '0a000000-0000-4000-a000-000000000001',
 'Turn research notes into an outline', 'turn-research-notes-into-an-outline',
 'Sorts loose research notes into a structured outline with the open gaps marked.',
 E'Sort these research notes into an outline with at most five sections. Under each section, list the notes that belong there. End with the questions the notes do not answer yet.\n\nNotes:\n{{notes}}',
 'research', '{research,outline,writing}', true, '2026-01-04T10:00:00Z', '2026-01-04T10:00:00Z', '2026-01-04T10:00:00Z'),
('0b000000-0000-4000-a000-000000000104', '0a000000-0000-4000-a000-000000000001',
 'Private draft of a cover note', 'private-draft-of-a-cover-note',
 'A private prompt of test-author. No other account may see it.',
 'Write a two-line cover note for the attached document.',
 'writing', '{private}', false, null, '2026-01-05T10:00:00Z', '2026-01-05T10:00:00Z');

-- ── test-author: two skills, two workflows ─────────────────────────────────

insert into public.skills (id, author_id, title, slug, description, content, category, tags, published, created_at, updated_at) values
('0b000000-0000-4000-a000-000000000201', '0a000000-0000-4000-a000-000000000001',
 'Review a pull request for risky changes', 'review-a-pull-request-for-risky-changes',
 'A skill that reads a pull request and names the changes most likely to break something.',
 E'# Review a pull request for risky changes\n\nUse this skill when someone asks for a review.\n\n## Steps\n\n1. Read the description, then the diff.\n2. Mark every change to authentication, money or deletion as risky.\n3. For each risky change, name the test that proves it, or say that none does.\n',
 'coding', '{review,pull-request}', true, '2026-01-06T10:00:00Z', '2026-01-06T10:00:00Z'),
('0b000000-0000-4000-a000-000000000202', '0a000000-0000-4000-a000-000000000001',
 'Write release notes from commits', 'write-release-notes-from-commits',
 'A skill that turns a list of commits into release notes a user can read.',
 E'# Write release notes from commits\n\nGroup the commits by what changes for the user, drop the internal ones, and write one plain sentence per change.\n',
 'writing', '{release,changelog}', true, '2026-01-07T10:00:00Z', '2026-01-07T10:00:00Z');

insert into public.workflows (id, author_id, title, slug, description, content, json, category, tags, published, created_at, updated_at) values
('0b000000-0000-4000-a000-000000000301', '0a000000-0000-4000-a000-000000000001',
 'Weekly research digest', 'weekly-research-digest',
 'Collects the week''s saved articles and writes a one-page digest.',
 E'# Weekly research digest\n\n1. Gather the links saved this week.\n2. Summarise each in two sentences.\n3. Group them by topic and write a one-page digest.\n',
 '{"steps": ["gather", "summarise", "group", "write"]}', 'research', '{research,weekly}', true, '2026-01-08T10:00:00Z', '2026-01-08T10:00:00Z'),
('0b000000-0000-4000-a000-000000000302', '0a000000-0000-4000-a000-000000000001',
 'Bug report triage', 'bug-report-triage',
 'Sorts new bug reports by severity and asks for what is missing.',
 E'# Bug report triage\n\n1. Read each new report.\n2. Ask for steps to reproduce when they are missing.\n3. Label the severity and the area.\n',
 '{"steps": ["read", "ask", "label"]}', 'coding', '{bugs,triage}', true, '2026-01-09T10:00:00Z', '2026-01-09T10:00:00Z');

-- ── test-author: one public prompt kit ─────────────────────────────────────

insert into public.prompt_kits (id, author_id, title, slug, description, content, category, tags, published, created_at, updated_at) values
('0b000000-0000-4000-a000-000000000401', '0a000000-0000-4000-a000-000000000001',
 'Launch week prompt kit', 'launch-week-prompt-kit',
 'Three prompts for the week a small product launches.',
 E'Use these in order during launch week.\n\n## Prompt: Announcement draft\nWrite a short announcement of {{product}} for people who have never heard of it. One paragraph, no superlatives.\n<!-- /prompt -->\n\n## Prompt: Questions from the first users\nRead these first messages from users and list the questions they ask most, with a draft answer for each.\n\n{{messages}}\n<!-- /prompt -->\n\n## Prompt: What to fix first\nFrom these bug reports and requests, pick the three changes that help the most people, and say why.\n\n{{reports}}\n<!-- /prompt -->\n',
 'business', '{launch,product}', true, '2026-01-10T10:00:00Z', '2026-01-10T10:00:00Z');

-- ── test-author: one public collection holding one item of each type ───────

insert into public.collections (id, owner_id, title, description, is_public, created_at, updated_at) values
('0b000000-0000-4000-a000-000000000501', '0a000000-0000-4000-a000-000000000001',
 'Starter collection', 'One prompt, one skill, one workflow and one prompt kit to start with.',
 true, '2026-01-11T10:00:00Z', '2026-01-11T10:00:00Z');

insert into public.collection_items (collection_id, item_type, item_id, sort_order) values
('0b000000-0000-4000-a000-000000000501', 'prompt',     '0b000000-0000-4000-a000-000000000101', 0),
('0b000000-0000-4000-a000-000000000501', 'skill',      '0b000000-0000-4000-a000-000000000201', 1),
('0b000000-0000-4000-a000-000000000501', 'workflow',   '0b000000-0000-4000-a000-000000000301', 2),
('0b000000-0000-4000-a000-000000000501', 'prompt_kit', '0b000000-0000-4000-a000-000000000401', 3);

-- ── test-new-author: one public item of each type, made today ──────────────

insert into public.prompts (id, author_id, title, slug, description, content, category, tags, is_public, published_at) values
('0b000000-0000-4000-a000-000000000111', '0a000000-0000-4000-a000-000000000002',
 'Ask for a second opinion', 'ask-for-a-second-opinion',
 'Asks the AI to argue against a plan before you commit to it.',
 E'Here is my plan. Argue against it as a sceptical colleague would: the three strongest objections, and what would change your mind.\n\nPlan:\n{{plan}}',
 'business', '{decisions}', true, now());

insert into public.skills (id, author_id, title, slug, description, content, category, tags, published) values
('0b000000-0000-4000-a000-000000000211', '0a000000-0000-4000-a000-000000000002',
 'Check a recipe for missing steps', 'check-a-recipe-for-missing-steps',
 'Reads a recipe and names the steps a beginner would miss.',
 E'# Check a recipe for missing steps\n\nRead the recipe as a beginner would and list every step it assumes but does not say.\n',
 'education', '{cooking}', true);

insert into public.workflows (id, author_id, title, slug, description, content, json, category, tags, published) values
('0b000000-0000-4000-a000-000000000311', '0a000000-0000-4000-a000-000000000002',
 'Morning inbox sweep', 'morning-inbox-sweep',
 'Sorts the morning inbox into reply now, later and never.',
 E'# Morning inbox sweep\n\n1. Read the subject lines.\n2. Sort into reply now, later and never.\n3. Draft the replies for the first group.\n',
 '{"steps": ["read", "sort", "draft"]}', 'business', '{email}', true);

insert into public.prompt_kits (id, author_id, title, slug, description, content, category, tags, published) values
('0b000000-0000-4000-a000-000000000411', '0a000000-0000-4000-a000-000000000002',
 'Interview practice kit', 'interview-practice-kit',
 'Two prompts to practise a job interview.',
 E'## Prompt: Ask me the questions\nAct as the interviewer for a {{role}} position. Ask one question at a time and wait for my answer.\n<!-- /prompt -->\n\n## Prompt: Rate my answers\nRate each of my answers from 1 to 5 and say what would make it a 5.\n<!-- /prompt -->\n',
 'education', '{interview,practice}', true);

-- ── test-reader: one private prompt, one unpublished skill, nothing public ─

insert into public.prompts (id, author_id, title, slug, description, content, category, tags, is_public, created_at, updated_at) values
('0b000000-0000-4000-a000-000000000121', '0a000000-0000-4000-a000-000000000003',
 'Reader private shopping list helper', 'reader-private-shopping-list-helper',
 'A private prompt of test-reader. No other account may see it.',
 'Turn this list of meals into a shopping list grouped by aisle.',
 'creative', '{private}', false, '2026-02-02T10:00:00Z', '2026-02-02T10:00:00Z');

insert into public.skills (id, author_id, title, slug, description, content, category, tags, published, created_at, updated_at) values
('0b000000-0000-4000-a000-000000000221', '0a000000-0000-4000-a000-000000000003',
 'Reader unpublished skill', 'reader-unpublished-skill',
 'An unpublished skill of test-reader.',
 E'# Reader unpublished skill\n\nNot published.\n',
 'education', '{private}', false, '2026-02-03T10:00:00Z', '2026-02-03T10:00:00Z');

-- ── The moderation queue ───────────────────────────────────────────────────
-- Publishing queued every item above for the AI moderation worker. They are
-- marked reviewed here, as if it had passed them, so starting a copy spends
-- nothing on the AI key; what a lap publishes afterwards is moderated for real.

update public.moderation_review_queue
   set status = 'reviewed', reviewed_at = now(), ai_reason = 'Seeded by the test copy'
 where status = 'pending'
   and item_id::text like '0b000000-0000-4000-a000-%';

commit;
