const { chromium } = require('playwright');

const topics = [
  ['STACK', 3],
  ['QUEUE', 3],
  ['BINARY_SEARCH', 3],
  ['BUBBLE_SORT', 10],
  ['LINEAR_SEARCH', 2],
  ['LINKED_LIST', 2],
  ['BST', 3],
  ['SELECTION_SORT', 4],
  ['TWO_POINTERS', 2],
  ['BFS', 5],
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  const runs = [];
  const requestsByTopic = new Map();
  let activePlaybackTopic = null;

  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', async (response) => {
    if (!response.url().includes('/pipeline/interact') || !activePlaybackTopic) return;
    const results = requestsByTopic.get(activePlaybackTopic) ?? [];
    const result = { status: response.status(), body: null };
    results.push(result);
    requestsByTopic.set(activePlaybackTopic, results);
    result.body = await response.json().catch(() => null);
  });

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.getByText('Current deterministic state').waitFor();

  for (const [topic, expectedOperations] of topics) {
    activePlaybackTopic = topic;
    requestsByTopic.set(topic, []);
    await page.locator('#topic-selector').selectOption(topic);
    await page.getByText('Current deterministic state').waitFor();
    await page.getByText('● VKVE VERIFIED', { exact: true }).waitFor();
    await page.getByRole('button', { name: '1.5×', exact: true }).click();
    const disableNarration = page.getByRole('button', { name: 'Disable narration', exact: true });
    if (await disableNarration.count()) await disableNarration.click();

    const firstOperationResponse = page.waitForResponse((response) => response.url().includes('/pipeline/interact'));
    await page.getByRole('button', { name: 'Replay timeline', exact: true }).click();
    await firstOperationResponse;
    const operationsBeforePause = (requestsByTopic.get(topic) ?? []).length;
    const sceneBeforePause = (await page.locator('body').innerText()).match(/Scene (\d+) of (\d+)/)?.[0];
    await page.getByRole('button', { name: 'Pause timeline', exact: true }).click();
    await page.waitForTimeout(100);
    const operationsWhilePaused = (requestsByTopic.get(topic) ?? []).length;
    const sceneWhilePaused = (await page.locator('body').innerText()).match(/Scene (\d+) of (\d+)/)?.[0];
    if (operationsWhilePaused !== operationsBeforePause || sceneWhilePaused !== sceneBeforePause) {
      throw new Error(`Pause advanced the operation or scene for ${topic}: operations ${operationsBeforePause} -> ${operationsWhilePaused}, scene ${sceneBeforePause} -> ${sceneWhilePaused}`);
    }
    await page.getByRole('button', { name: 'Play timeline', exact: true }).click();
    await page.getByText('Verified algorithm sequence complete. Final state is shown above.', { exact: true })
      .waitFor({ timeout: 180000 });

    const body = await page.locator('body').innerText();
    const hasQuiz = body.includes('Verified knowledge check');
    const hasDryRun = body.includes('Deterministic dry run');
    const hasTutor = body.includes('AI Tutor');
    const statePanel = page.locator('strong').filter({ hasText: 'Current deterministic state' }).locator('..');
    const stateBeforeTutor = await statePanel.innerText();
    await page.locator('textarea').fill('Explain the current verified state and the last operation.');
    await page.getByRole('button', { name: 'Ask Tutor', exact: true }).click();
    await page.waitForFunction(() => {
      const prompt = 'Ask a question to get a verified explanation for the current topic and state.';
      return !document.body.innerText.includes(prompt);
    });
    const stateAfterTutor = await statePanel.innerText();
    const tutorDidNotMutateState = stateBeforeTutor === stateAfterTutor;
    const scene = body.match(/Scene (\d+) of (\d+)/);
    const operations = requestsByTopic.get(topic) ?? [];
    const expectedScenes = expectedOperations + 1;
    const allTransitionsVerified = operations.length === expectedOperations && operations.every((result) =>
      result.status === 200
      && result.body?.data?.transition?.isValidTransition === true
      && result.body?.data?.verificationReport?.valid === true
      && result.body?.data?.updatedScene?.semanticIntent?.expectedStateSnapshot
      && JSON.stringify(result.body.data.updatedScene.semanticIntent.expectedStateSnapshot) === JSON.stringify(result.body.data.updatedState)
      && result.body?.data?.narration?.sceneId === result.body?.data?.updatedScene?.id
      && result.body?.data?.narration?.text === result.body?.data?.updatedScene?.narration?.text,
    );
    const fullRunVerified = Boolean(scene && Number(scene[1]) === expectedScenes && Number(scene[2]) === expectedScenes)
      && body.includes('Verified algorithm sequence complete.')
      && allTransitionsVerified;

    runs.push({
      topic,
      expectedOperations,
      verifiedOperations: operations.filter((result) => result.status === 200 && result.body?.data?.verificationReport?.valid).length,
      finalScene: scene ? `${scene[1]} of ${scene[2]}` : 'not found',
      pauseHeldSameOperation: operationsWhilePaused === operationsBeforePause && sceneWhilePaused === sceneBeforePause,
      hasQuiz,
      hasDryRun,
      hasTutor,
      tutorDidNotMutateState,
      fullRunVerified,
    });
    if (!fullRunVerified || !hasQuiz || !hasDryRun || !hasTutor || !tutorDidNotMutateState) {
      throw new Error(`Submission feature audit failed for ${topic}: ${JSON.stringify(runs.at(-1))}`);
    }
  }

  // Stop must cancel an in-progress run without permitting a late operation to update the session.
  activePlaybackTopic = 'BFS';
  const bfsRequestCount = (requestsByTopic.get('BFS') ?? []).length;
  const bfsStopTransition = page.waitForResponse((response) => response.url().includes('/pipeline/interact'));
  await page.getByRole('button', { name: 'Replay timeline', exact: true }).click();
  await bfsStopTransition;
  const bfsCountAfterStopTransition = (requestsByTopic.get('BFS') ?? []).length;
  await page.getByRole('button', { name: 'Stop timeline', exact: true }).click();
  await page.waitForTimeout(900);
  const stoppedWithoutLateOperation = bfsCountAfterStopTransition === bfsRequestCount + 1
    && (requestsByTopic.get('BFS') ?? []).length === bfsCountAfterStopTransition;

  // Changing topics after a verified step invalidates the old lesson run.
  const bfsTopicChangeTransition = page.waitForResponse((response) => response.url().includes('/pipeline/interact'));
  await page.getByRole('button', { name: 'Play timeline', exact: true }).click();
  await bfsTopicChangeTransition;
  const bfsCountAfterTopicChangeTransition = (requestsByTopic.get('BFS') ?? []).length;
  await page.locator('#topic-selector').selectOption('STACK');
  await page.getByText('Current deterministic state').waitFor();
  await page.waitForTimeout(900);
  const topicChangeCancelledOldRun = bfsCountAfterTopicChangeTransition === bfsCountAfterStopTransition + 1
    && (requestsByTopic.get('BFS') ?? []).length === bfsCountAfterTopicChangeTransition;

  console.log(JSON.stringify({
    runs,
    totalVerifiedOperations: runs.reduce((sum, run) => sum + run.verifiedOperations, 0),
    stoppedWithoutLateOperation,
    topicChangeCancelledOldRun,
    errors,
    success: runs.length === topics.length
      && runs.every((run) => run.fullRunVerified)
      && runs.every((run) => run.pauseHeldSameOperation)
      && stoppedWithoutLateOperation
      && topicChangeCancelledOldRun
      && errors.length === 0,
  }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
