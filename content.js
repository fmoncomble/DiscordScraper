window.onload = () => {
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length) {
                const avatarWrapper = document.querySelector(
                    '.avatarWrapper__37e49'
                );
                if (avatarWrapper) {
                    observer.disconnect();
                    handleAvatarWrapper(avatarWrapper);
                    break;
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function handleAvatarWrapper(avatarWrapper) {
        avatarWrapper.addEventListener('mousedown', (e) => {
            if (e.button === 2) {
                avatarWrapper.style.position = 'relative';
                const popup = document.createElement('div');
                popup.classList.add('discord_scraper_popup');
                popup.textContent = 'Copy user token';
                popup.onclick = (e) => {
                    e.stopPropagation();
                    const token = getToken();
                    if (token) {
                        navigator.clipboard.writeText(token).then(
                            () => {
                                popup.style.color = 'green';
                                popup.textContent = 'Token copied';
                                setTimeout(() => {
                                    popup.remove();
                                    window.close();
                                }, 1000);
                            },
                            (err) => {
                                popup.style.color = 'red';
                                popup.textContent = 'Error';
                                setTimeout(() => {
                                    popup.remove();
                                }, 1000);
                                console.error(
                                    'Failed to copy token to clipboard',
                                    err
                                );
                            }
                        );
                    } else {
                        popup.style.color = 'red';
                        popup.textContent = 'Error';
                        setTimeout(() => {
                            popup.remove();
                        }, 1000);
                    }
                };
                avatarWrapper.before(popup);
            }
        });
    }

    function getToken() {
        let app =
            window.webpackChunkdiscord_app || document.webpackChunkdiscord_app;
        if (!app) {
            console.error('Failed to find discord_app chunk');
            return;
        }
        let token = (window.webpackChunkdiscord_app.push([
            [''],
            {},
            (e) => {
                m = [];
                for (let c in e.c) m.push(e.c[c]);
            },
        ]),
        m)
            .find((m) => m?.exports?.default?.getToken !== void 0)
            .exports.default.getToken();
        return token;
    }
};
