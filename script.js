(() => {
    const TOTAL_CHAMBERS = 6;
    const COOLDOWN_MS = 3000;
    const TRANSITION_INTRO_MS = 350; // 白屏渐入时间
    const VIBRATE_DURATION_MS = 280; // 震动持续时间
    const DECISION_DELAY_MS = 800; // 结果判定延迟
    const TRANSITION_OUTRO_MS = 280; // 白屏渐出时间

    const defaultScreen = document.getElementById('default-screen');
    const transitionScreen = document.getElementById('transition-screen');
    const deathScreen = document.getElementById('death-screen');

    const shotCountLabel = document.getElementById('shot-count');
    const hintText = defaultScreen.querySelector('.hint-text');
    const shootBtn = document.getElementById('shoot-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resetDeathBtn = document.getElementById('reset-death-btn');

    let shotCount = 0;
    let isDead = false;
    let cooldownTimer = null;
    let transitionTimer = null;

    // 弹药管数组，其中一个位置是子弹
    let chambers = [];

    // 初始化弹药管
    const initializeChambers = () => {
        chambers = new Array(TOTAL_CHAMBERS).fill(false);
        // 随机选择一个位置放置子弹
        const bulletPosition = Math.floor(Math.random() * TOTAL_CHAMBERS);
        chambers[bulletPosition] = true;
        console.log('子弹在第', bulletPosition + 1, '个位置');
    };

    // 初始化游戏
    initializeChambers();

    const formatProbability = (count) => {
        if (count >= TOTAL_CHAMBERS) return 0;
        // 剩余位置中有子弹的概率
        const remainingChambers = chambers.slice(count);
        const hasBullet = remainingChambers.includes(true);
        if (!hasBullet) return 0;
        return Math.round(100 / remainingChambers.length);
    };

    const vibrateDevice = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate(VIBRATE_DURATION_MS);
        }
    };

    const updateShotCounter = () => {
        shotCountLabel.textContent = `${Math.min(shotCount, TOTAL_CHAMBERS)} / ${TOTAL_CHAMBERS}`;
        if (shotCount >= TOTAL_CHAMBERS) {
            hintText.textContent = '弹仓已被全部触发，请点击重置重新开始。';
        } else {
            hintText.textContent = `下一次开枪死亡概率约为 ${formatProbability(shotCount)}%。`;
        }
    };

    const showTransition = () => {
        transitionScreen.classList.add('active');
    };

    const hideTransition = () => {
        transitionScreen.classList.remove('active');
    };

    const goToDeathScreen = () => {
        defaultScreen.classList.remove('active');
        deathScreen.classList.add('active');
    };

    const queueCooldownReset = () => {
        clearTimeout(cooldownTimer);
        cooldownTimer = setTimeout(() => {
            if (!isDead && shotCount < TOTAL_CHAMBERS) {
                shootBtn.disabled = false;
            }
        }, COOLDOWN_MS);
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleShoot = async() => {
        if (isDead || shootBtn.disabled) {
            return;
        }

        shootBtn.disabled = true;
        // 检查当前弹药管位置是否有子弹
        const isDeathRoll = chambers[shotCount];

        // 清理现有定时器
        clearTimeout(transitionTimer);
        clearTimeout(cooldownTimer);

        try {
            // 1. 显示过渡画面
            showTransition();
            await sleep(TRANSITION_INTRO_MS);

            // 2. 震动
            vibrateDevice();
            await sleep(VIBRATE_DURATION_MS);

            // 3. 等待判定时间
            await sleep(DECISION_DELAY_MS - VIBRATE_DURATION_MS);

            // 4. 执行结果
            if (isDeathRoll) {
                isDead = true;
                goToDeathScreen();
                await sleep(TRANSITION_OUTRO_MS);
                hideTransition();
            } else {
                if (shotCount < TOTAL_CHAMBERS) {
                    shotCount += 1;
                }
                updateShotCounter();
                hideTransition();

                if (shotCount >= TOTAL_CHAMBERS) {
                    shootBtn.disabled = true;
                    shootBtn.setAttribute('aria-disabled', 'true');
                } else {
                    // 5. 设置冷却
                    cooldownTimer = setTimeout(() => {
                        if (!isDead) {
                            shootBtn.disabled = false;
                        }
                    }, COOLDOWN_MS - (TRANSITION_INTRO_MS + DECISION_DELAY_MS));
                }
            }
        } catch (error) {
            console.error('Error during shoot sequence:', error);
            hideTransition();
            shootBtn.disabled = false;
        }
    };

    const handleReset = () => {
        const shouldReset = window.confirm('确认要重新开始吗？\n当前进度将被清除。');
        if (shouldReset) {
            window.location.reload();
        }
    };

    shootBtn.addEventListener('click', handleShoot);
    resetBtn.addEventListener('click', handleReset);
    resetDeathBtn.addEventListener('click', handleReset);

    updateShotCounter();

    window.addEventListener('beforeunload', () => {
        clearTimeout(cooldownTimer);
        clearTimeout(transitionTimer);
    });
})();