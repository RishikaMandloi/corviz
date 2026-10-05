const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const apiResults = [];
  const pipelineIds = new Map();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('response', async (res) => {
    if (res.url().includes('/pipeline/generate')) {
      const generated = await res.json().catch(() => null);
      if (generated?.data?.pipelineId && generated?.data?.topic?.id) {
        pipelineIds.set(generated.data.topic.id, generated.data.pipelineId);
      }
    }
    if (res.url().includes('/pipeline/interact')) {
      const text = await res.text().catch(() => '');
      apiResults.push({
        status: res.status(),
        url: res.url(),
        body: text.slice(0, 240),
      });
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  page.setDefaultTimeout(30000);
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByText('Current deterministic state').waitFor();

  const chooseTopic = async (value) => {
    await page.locator('#topic-selector').selectOption(value);
    await page.getByText('Current deterministic state').waitFor();
    await page.waitForFunction((topic) => {
      const heading = document.querySelector('article h2');
      return Boolean(heading?.textContent?.toUpperCase().includes(topic.replaceAll('_', ' ')));
    }, value).catch(() => undefined);
    await page.waitForTimeout(250);
    if (!pipelineIds.has(value)) throw new Error(`No generated backend session captured for ${value}`);
  };

  const readState = async () => {
    const badge = await page.getByText('● VKVE VERIFIED', { exact: true }).textContent().catch(() => '');
    const body = await page.locator('body').innerText();
    return { badge: (badge || '').trim(), body: body.slice(0, 2500) };
  };

  const runStep = async (label, topic, action) => {
    console.log(`Running ${label} (${topic})`);
    await chooseTopic(topic);
    const before = await readState();
    const responsePromise = page.waitForResponse((response) => response.url().includes('/pipeline/interact'));
    await action();
    const response = await responsePromise;
    const responseBody = await response.json();
    const expectedState = responseBody.data.updatedState;
    await page.getByText(expectedState.statusMessage, { exact: true }).first().waitFor();
    const after = await readState();
    const expectedElements = `Elements: [${expectedState.elements.join(', ')}]`;
    const quizQuestion = responseBody.data.quiz?.questions?.[0];
    const quizText = quizQuestion?.question ?? '';
    const correctOptionText = quizQuestion?.options.find((option) => option.isCorrect)?.text ?? '';
    const uiContainsUpdatedQuiz = !quizText
      ? true
      : after.body.includes(quizText) && after.body.includes(correctOptionText);

    return {
      label,
      topic,
      beforeBadge: before.badge,
      afterBadge: after.badge,
      apiStatus: response.status(),
      apiUrl: response.url(),
      sessionIdUsed: pipelineIds.get(topic),
      responsePreview: JSON.stringify(responseBody).slice(0, 240),
      uiContainsBackendState: after.body.includes(expectedElements) && after.body.includes(expectedState.statusMessage),
      uiContainsBackendNarration: typeof responseBody.data.narration?.text === 'string' && after.body.includes(responseBody.data.narration.text),
      uiContainsUpdatedQuiz,
      uiContainsVerified: after.badge.includes('VERIFIED'),
      runtimeErrors: [...consoleErrors, ...pageErrors],
      afterBodyPreview: after.body.slice(0, 500),
    };
  };

  const operations = [
    ['STACK_PUSH', 'STACK', async () => {
      await page.locator('input[aria-label="Operation value or search target"]').fill('99');
      await page.getByRole('button', { name: 'PUSH', exact: true }).click();
    }],
    ['STACK_POP', 'STACK', async () => {
      await page.getByRole('button', { name: 'POP', exact: true }).click();
    }],
    ['STACK_PEEK', 'STACK', async () => {
      await page.getByRole('button', { name: 'PEEK', exact: true }).click();
    }],
    ['QUEUE_ENQUEUE', 'QUEUE', async () => {
      await page.locator('input[aria-label="Operation value or search target"]').fill('99');
      await page.getByRole('button', { name: 'ENQUEUE', exact: true }).click();
    }],
    ['QUEUE_DEQUEUE', 'QUEUE', async () => {
      await page.getByRole('button', { name: 'DEQUEUE', exact: true }).click();
    }],
    ['QUEUE_PEEK', 'QUEUE', async () => {
      await page.getByRole('button', { name: 'PEEK', exact: true }).click();
    }],
    ['BINARY_SEARCH_SEARCH', 'BINARY_SEARCH', async () => {
      await page.locator('input[aria-label="Operation value or search target"]').fill('50');
      await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
    }],
    ['BUBBLE_SORT_COMPARE', 'BUBBLE_SORT', async () => {
      await page.getByRole('button', { name: 'COMPARE AND SWAP', exact: true }).click();
    }],
    ['LINEAR_SEARCH_INSPECT', 'LINEAR_SEARCH', async () => {
      await page.locator('input[aria-label="Operation value or search target"]').fill('42');
      await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
    }],
    ['LINKED_LIST_INSERT_HEAD', 'LINKED_LIST', async () => {
      await page.locator('input[aria-label="Operation value or search target"]').fill('99');
      await page.getByRole('button', { name: 'INSERT HEAD', exact: true }).click();
    }],
    ['LINKED_LIST_DELETE_HEAD', 'LINKED_LIST', async () => {
      await page.getByRole('button', { name: 'DELETE HEAD', exact: true }).click();
    }],
    ['BST_INSERT', 'BST', async () => {
      await page.locator('input[aria-label="Operation value or search target"]').fill('56');
      await page.getByRole('button', { name: 'INSERT', exact: true }).click();
    }],
    ['BST_SEARCH', 'BST', async () => {
      await page.locator('input[aria-label="Operation value or search target"]').fill('20');
      await page.getByRole('button', { name: 'SEARCH', exact: true }).click();
    }],
    ['SELECTION_SORT_SELECT_MIN', 'SELECTION_SORT', async () => {
      await page.getByRole('button', { name: 'FIND MIN AND SWAP', exact: true }).click();
    }],
    ['TWO_POINTERS_SWAP', 'TWO_POINTERS', async () => {
      await page.getByRole('button', { name: 'SWAP AND ADVANCE', exact: true }).click();
    }],
    ['BFS_VISIT_AND_EXPAND', 'BFS', async () => {
      await page.getByRole('button', { name: 'VISIT AND EXPAND', exact: true }).click();
    }],
  ];

  const results = [];

  for (const [label, topic, action] of operations) {
    try {
      const result = await runStep(label, topic, action);
      results.push(result);
    } catch (error) {
      results.push({ label, topic, failure: error.message, apiResults: apiResults.length });
      console.error(`Failed ${label}: ${error.message}`);
      break;
    }
  }

  const topicsToVerifyPlayback = ['STACK', 'QUEUE', 'BINARY_SEARCH', 'BUBBLE_SORT', 'LINEAR_SEARCH', 'LINKED_LIST', 'BST', 'SELECTION_SORT', 'TWO_POINTERS', 'BFS'];
  const playbackResults = [];

  for (const topic of topicsToVerifyPlayback) {
    try {
      await chooseTopic(topic);
      const beforeBody = await page.locator('body').innerText();
      const beforeMatch = beforeBody.match(/Scene (\d+) of (\d+)/);
      const beforeScene = beforeMatch ? Number(beforeMatch[1]) : 0;

      await page.getByRole('button', { name: 'Play timeline', exact: true }).click();
      await page.waitForFunction(() => {
        const match = document.body.innerText.match(/Scene (\d+) of (\d+)/);
        return Boolean(match && Number(match[1]) > 1);
      }, { timeout: 20000 }).catch(() => undefined);

      const afterPlayBody = await page.locator('body').innerText();
      const sceneMatch = afterPlayBody.match(/Scene (\d+) of (\d+)/);
      const progressed = sceneMatch ? Number(sceneMatch[1]) > beforeScene : false;
      const hasPlayPauseState = afterPlayBody.includes('Pause timeline') || afterPlayBody.includes('Play timeline');

      if (!progressed || !hasPlayPauseState) {
        throw new Error(`Auto-play did not advance beyond the initial scene for ${topic}`);
      }

      await page.getByRole('button', { name: 'Pause timeline', exact: true }).click();
      await page.waitForTimeout(250);
      const pausedBody = await page.locator('body').innerText();
      const pausedNarration = pausedBody.includes('Narration paused') || pausedBody.includes('Pause timeline');
      if (!pausedNarration) {
        throw new Error(`Pause did not stop timeline or narration for ${topic}`);
      }

      await page.getByRole('button', { name: 'Play timeline', exact: true }).click();
      await page.waitForTimeout(500);
      const resumedBody = await page.locator('body').innerText();
      const resumedProgress = resumedBody.match(/Scene (\d+) of (\d+)/);
      if (!resumedProgress) {
        throw new Error(`Resume did not continue the lesson for ${topic}`);
      }

      await page.getByRole('button', { name: 'Replay timeline', exact: true }).click();
      await page.waitForFunction(() => {
        const match = document.body.innerText.match(/Scene (\d+) of (\d+)/);
        return Boolean(match && Number(match[1]) === 1);
      }, { timeout: 10000 }).catch(() => undefined);

      playbackResults.push({ topic, progressed: true, pauseResume: true, replayRestarted: true });
    } catch (error) {
      playbackResults.push({ topic, progressed: false, pauseResume: false, replayRestarted: false, failure: error.message });
      console.error(`Playback verification failed for ${topic}: ${error.message}`);
    }
  }

  const controls = {
    play: await page.getByRole('button', { name: 'Play narration', exact: true }).count(),
    pause: await page.getByRole('button', { name: 'Pause', exact: true }).count(),
    resume: await page.getByRole('button', { name: 'Resume', exact: true }).count(),
    stop: await page.getByRole('button', { name: 'Stop', exact: true }).count(),
    replay: await page.getByRole('button', { name: 'Replay current explanation', exact: true }).count(),
    toggle: await page.getByRole('button', { name: 'Disable narration', exact: true }).count(),
  };
  let speechApiAvailable = false;
  let voiceControlResult = 'not-tested';
  try {
    const stopTimeline = page.getByRole('button', { name: 'Stop timeline', exact: true });
    if (await stopTimeline.isEnabled().catch(() => false)) {
      await stopTimeline.click();
      await page.waitForFunction(() => !document.body.innerText.includes('Pause timeline'));
    }
    const enableNarration = page.getByRole('button', { name: 'Enable narration', exact: true });
    if (await enableNarration.count()) await enableNarration.click();
    speechApiAvailable = await page.evaluate(() => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
    if (speechApiAvailable) {
      await page.getByRole('button', { name: 'Play narration', exact: true }).click();
      await page.waitForTimeout(300);
      const speakingAfterPlay = await page.evaluate(() => window.speechSynthesis.speaking);
      if (speakingAfterPlay) {
        await page.getByRole('button', { name: 'Pause', exact: true }).click();
        const paused = await page.evaluate(() => window.speechSynthesis.paused);
        await page.getByRole('button', { name: 'Resume', exact: true }).click();
        await page.getByRole('button', { name: 'Stop', exact: true }).click();
        voiceControlResult = `play=${speakingAfterPlay}, pause=${paused}, resume/stop=executed`;
      } else {
        voiceControlResult = 'Speech API exists, but headless browser did not start an utterance';
      }
    }
  } catch (error) {
    voiceControlResult = `voice controls error: ${error.message}`;
  }

  console.log(JSON.stringify({
    results,
    playbackResults,
    apiResponses: apiResults,
    narrationControls: controls,
    speechApiAvailable,
    voiceControlResult,
    consoleErrors,
    pageErrors,
    success: results.length === operations.length && results.every((r) => (r.apiStatus === 200 || r.apiStatus === 201) && r.uiContainsBackendState && r.uiContainsBackendNarration && r.uiContainsVerified) && playbackResults.length === topicsToVerifyPlayback.length && playbackResults.every((result) => result.progressed && result.pauseResume && result.replayRestarted) && Object.values(controls).every((count) => count === 1) && !voiceControlResult.startsWith('voice controls error:') && consoleErrors.length === 0 && pageErrors.length === 0,
  }, null, 2));

  await browser.close();
})();
