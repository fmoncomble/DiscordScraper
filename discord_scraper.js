document.addEventListener('DOMContentLoaded', () => {
    const getTokenDiv = document.getElementById('get_token');
    const getTokenBtn = document.getElementById('get_token');
    const tokenInput = document.getElementById('token');
    const saveTokenBtn = document.getElementById('save_token');
    const container = document.getElementById('container');
    const serverSelect = document.getElementById('servers');
    const channelSelect = document.getElementById('channels');
    const startBtn = document.getElementById('start');
    const stopBtn = document.getElementById('stop');
    const counter = document.getElementById('counter');
    const dlBtnContainer = document.getElementById('dl_btn_container');
    const dlBtn = document.getElementById('dl_btn');
    const dlContainer = document.getElementById('download_container');
    const dlDialog = document.getElementById('dl_dialog');
    const dlSelect = document.getElementById('format-select');
    const dlConfirmBtn = document.getElementById('dl-confirm-btn');

    getTokenBtn.addEventListener('click', () => {
        window.open('https://discord.com/channels/@me', '_blank');
        tokenInput.focus();
    });
    let token = chrome.storage.local.get('token', async (data) => {
        token = data.token;
        if (token) {
            getTokenDiv.style.display = 'none';
            tokenInput.value = token;
            tokenInput.disabled = true;
            saveTokenBtn.textContent = 'Clear';
            getUser(token);
            getServers(token);
        }
    });
    saveTokenBtn.addEventListener('click', async () => {
        if (!token) {
            token = tokenInput.value;
            chrome.storage.local.set({ token: token }, () => {
                console.log('Token saved');
            });
            saveTokenBtn.textContent = 'Clear';
            getTokenDiv.style.display = 'none';
            tokenInput.disabled = true;
            getUser(token);
            getServers(token);
        } else if (token) {
            token = null;
            tokenInput.value = null;
            tokenInput.disabled = false;
            chrome.storage.local.remove('token', () => {
                console.log('Token cleared');
            });
            saveTokenBtn.textContent = 'Save';
            getTokenDiv.style.display = 'block';
            container.style.display = 'none';
        }
    });
    tokenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveTokenBtn.click();
        }
    });

    let username;

    async function getUser(token) {
        fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: token,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                userId = data.id;
                username = data.username;
                tokenInput.value = `Logged in as ${username}`;
            })
            .catch((err) => {
                window.alert('Invalid token');
                console.error('Failed to get user', err);
            });
    }

    async function getServers(token) {
        container.style.display = 'block';
        fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                Authorization: token,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                serverSelect.innerHTML = '';
                data.forEach((server) => {
                    const option = document.createElement('option');
                    option.value = server.id;
                    option.textContent = server.name;
                    serverSelect.appendChild(option);
                });
                getChannels(token);
            })
            .catch((err) => {
                window.alert('Invalid token');
                console.error('Failed to get servers', err);
            });
    }

    serverSelect.addEventListener('change', () => {
        counter.textContent = '';
        dlBtnContainer.style.display = 'none';
        getChannels(token);
    });

    let channels = [];
    async function getChannels(token) {
        channels = [];
        let serverId = serverSelect.value;
        let res = await fetch(
            `https://discord.com/api/v10/guilds/${serverId}/channels`,
            {
                headers: {
                    Authorization: token,
                },
            }
        );
        if (!res.ok) {
            window.alert('You do not have access to this server');
            return;
        } else {
            let data = await res.json();
            channelSelect.innerHTML = '';
            data.forEach(async (channel) => {
                if (
                    channel.type === 0 ||
                    channel.type === 5 ||
                    channel.type === 1
                ) {
                    channels.push(channel);
                    const option = document.createElement('option');
                    option.value = channel.id;
                    option.textContent = channel.name;
                    channelSelect.appendChild(option);
                }
            });
        }
    }

    channelSelect.addEventListener('change', () => {
        counter.textContent = '';
        dlBtnContainer.style.display = 'none';
    });

    let messages = [];
    let abort = false;
    startBtn.addEventListener('click', () => {
        messages = [];
        abort = false;
        counter.textContent = '';
        dlBtnContainer.style.display = 'none';
        let channel = channels.find((c) => c.id === channelSelect.value);
        let channelId = channel.id;
        let before = channel.last_message_id;
        getMessages(token, channelId, before);
    });
    stopBtn.addEventListener('click', () => {
        abort = true;
    });

    async function getMessages(token, channelId, before) {
        startBtn.style.display = 'none';
        stopBtn.style.display = 'inline-block';
        serverSelect.disabled = true;
        channelSelect.disabled = true;
        if (abort === true) {
            if (messages.length > 0) {
                counter.textContent += ' ✅';
                dlBtnContainer.style.display = 'block';
            } else {
                counter.textContent = 'Aborted';
            }
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            serverSelect.disabled = false;
            channelSelect.disabled = false;
            return;
        }
        try {
            let url = `https://discord.com/api/v10/channels/${channelId}/messages?limit=100`;
            if (before) {
                url += `&before=${before}`;
            }
            let res = await fetch(url, {
                headers: {
                    Authorization: token,
                },
            });
            if (res.ok) {
                let data = await res.json();
                messages.push(...data);
                counter.textContent = `Messages collected: ${messages.length}`;
                if (data.length === 100) {
                    getMessages(token, channelId, data[data.length - 1].id);
                } else {
                    counter.textContent += ' ✅';
                    stopBtn.style.display = 'none';
                    startBtn.style.display = 'inline-block';
                    dlBtnContainer.style.display = 'block';
                    serverSelect.disabled = false;
                    channelSelect.disabled = false;
                }
            } else {
                window.alert('You do not have access to this channel');
                stopBtn.style.display = 'none';
                startBtn.style.display = 'inline-block';
                return;
            }
        } catch (error) {
            window.alert('An error occurred retrieving channel messages');
            console.error('Failed to get messages', error);
        }
    }

    dlBtn.addEventListener('click', () => {
        buildDownloadOptions();
    });

    function buildDownloadOptions() {
        // Function to filter data items to suggest
        function getCommonKeys(messages) {
            if (messages.length === 0) return [];

            const commonKeys = new Set(Object.keys(messages[0]));

            for (let record of messages) {
                if (!record) {
                    continue;
                }
                for (let key of commonKeys) {
                    if (!(key in record)) {
                        commonKeys.delete(key);
                    }
                }
            }

            return Array.from(commonKeys);
        }

        // Function to build an object of available keys
        function buildKeyTree(obj, commonKeys, prefix = '') {
            let tree = {};
            for (let key of commonKeys) {
                const fullKey = prefix ? `${prefix}.${key}` : key;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    tree[fullKey] = buildKeyTree(
                        obj[key],
                        Object.keys(obj[key]),
                        fullKey
                    );
                } else {
                    tree[fullKey] = null;
                }
            }
            return tree;
        }

        if (messages.length > 0) {
            const commonKeys = getCommonKeys(messages);
            const keyTree = buildKeyTree(messages[0], commonKeys);
            const container = dlDialog.querySelector('#keys-container');
            container.textContent = '';
            generateListTree(keyTree, container);
            const checkboxes = dlDialog.querySelectorAll(
                'input[type="checkbox"].data-item'
            );
            checkboxes.forEach((checkbox) => {
                updateParentCheckboxes(checkbox);
            });
            dlBtn.textContent = 'Download';
            dlBtn.disabled = false;
            dlBtn.style.cursor = 'pointer';
            const closeBtn = dlDialog.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                dlDialog.close();
            });
            dlDialog.showModal();
        }
    }

    // Function to generate a tree of available keys
    function generateListTree(tree, container) {
        const ul = document.createElement('ul');
        ul.style.listStyleType = 'none';

        for (let key in tree) {
            if (tree.hasOwnProperty(key)) {
                const li = document.createElement('li');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.classList.add('data-item');
                checkbox.id = key;
                checkbox.name = key;

                if (
                    key === 'content' ||
                    key === 'author.username' ||
                    key === 'timestamp'
                ) {
                    checkbox.checked = true;
                }

                const label = document.createElement('label');
                label.htmlFor = key;
                label.appendChild(
                    document.createTextNode(
                        key.split('.')[key.split('.').length - 1]
                    )
                );

                li.appendChild(checkbox);
                li.appendChild(label);
                ul.appendChild(li);

                if (tree[key] !== null) {
                    const nestedContainer = document.createElement('div');
                    nestedContainer.style.marginLeft = '20px';
                    generateListTree(tree[key], nestedContainer);
                    li.appendChild(nestedContainer);

                    checkbox.addEventListener('change', function () {
                        const childCheckboxes =
                            nestedContainer.querySelectorAll(
                                'input[type="checkbox"]'
                            );
                        childCheckboxes.forEach((childCheckbox) => {
                            childCheckbox.checked = checkbox.checked;
                            childCheckbox.indeterminate = false;
                        });
                    });
                }

                checkbox.addEventListener('change', function () {
                    updateParentCheckboxes(checkbox);
                });
            }
        }
        container.appendChild(ul);
    }

    // Function to monitor checkboxes
    function updateParentCheckboxes(checkbox) {
        const parentLi = checkbox.closest('li').parentElement.closest('li');
        if (parentLi) {
            const parentCheckbox = parentLi.querySelector(
                'input[type="checkbox"]'
            );
            const childCheckboxes = parentLi.querySelectorAll(
                'div > ul > li > input[type="checkbox"]'
            );
            const allChecked = Array.from(childCheckboxes).every(
                (child) => child.checked
            );
            const someChecked = Array.from(childCheckboxes).some(
                (child) => child.checked
            );

            parentCheckbox.checked = allChecked;
            parentCheckbox.indeterminate = !allChecked && someChecked;

            updateParentCheckboxes(parentCheckbox);
        }
    }

    let dlFormat = 'xml';
    dlSelect.addEventListener('change', () => {
        dlFormat = dlSelect.value;
        if (dlFormat === 'xlsx') {
            const tableFormat = document.createElement('label');
            tableFormat.htmlFor = 'table-checkbox';
            tableFormat.textContent = 'Format as table';
            tableFormat.style.display = 'block';
            const tableCheckbox = document.createElement('input');
            tableCheckbox.type = 'checkbox';
            tableCheckbox.id = 'table-checkbox';
            tableCheckbox.style.verticalAlign = 'middle';
            tableCheckbox.checked = true;
            tableFormat.appendChild(tableCheckbox);
            dlConfirmBtn.after(tableFormat);
        } else {
            const tableFormat = document.querySelector(
                'label[for="table-checkbox"]'
            );
            if (tableFormat) {
                tableFormat.remove();
            }
        }
    });

    let posts = [];
    let filename;
    dlConfirmBtn.addEventListener('click', () => {
        buildData();
        filename = `${serverSelect.options[serverSelect.selectedIndex].text}_${
            channelSelect.options[channelSelect.selectedIndex].text
        }`;
        if (dlFormat === 'json') {
            downloadJson(filename);
        } else if (dlFormat === 'csv') {
            downloadCsv(filename);
        } else if (dlFormat === 'xml') {
            downloadXml(filename);
        } else if (dlFormat === 'txt') {
            downloadTxt(filename);
        } else if (dlFormat === 'xlsx') {
            downloadXlsx(filename);
        }
    });

    // Function to get nested values from an object
    function getNestedValue(obj, keyPath) {
        return keyPath.split('.').reduce((acc, key) => acc && acc[key], obj);
    }

    // Function to build the array of posts
    function buildData() {
        posts = [];
        const checkboxes = dlDialog.querySelectorAll(
            'input[type="checkbox"].data-item'
        );
        for (let m of messages) {
            let post = {};
            for (let checkbox of checkboxes) {
                if (checkbox.checked) {
                    const key = checkbox.id;
                    const value = getNestedValue(m, key);
                    post[key.replaceAll('.', '-')] = value;
                }
            }
            let serverId = serverSelect.value;
            post.url = `https://discord.com/channels/${serverId}/${m.channel_id}/${m.id}`;
            posts.push(post);
        }
    }

    // Download functions
    function downloadCsv(filename) {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        const header = Object.keys(posts[0]).join('\t');
        const rows = posts.map((post) => Object.values(post).join('\t'));
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${filename}.csv`;
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    function downloadJson(filename) {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        const json = JSON.stringify(posts, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${filename}.json`;
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    function downloadXml(filename) {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        let xml = '<Text>';
        for (let p of posts) {
            let postData = '<lb></lb>\n<message';
            for (let [key, value] of Object.entries(p)) {
                if (typeof value === 'string') {
                    p[key] = value
                        .replaceAll(/&/g, '&amp;')
                        .replaceAll(/</g, '&lt;')
                        .replaceAll(/>/g, '&gt;')
                        .replaceAll(/"/g, '&quot;')
                        .replaceAll(/'/g, '&apos;')
                        .replaceAll(/\u00A0/g, ' ');
                }
                if (key !== 'content' && key !== 'url') {
                    postData += ` ${key}="${p[key]}"`;
                }
            }
            postData += '>';
            postData += `<lb></lb><ref target="${p.url}">Link to post</ref><lb></lb>`;
            let text = p['content'];
            const urlRegex =
                /(?:https?|ftp):\/\/[-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[-A-Za-z0-9+&@#\/%=~_|]/;
            const links = text.match(urlRegex);
            if (links) {
                for (l of links) {
                    const newLink = l.replace(
                        /(.+)/,
                        `<ref target="$1">$1</ref>`
                    );
                    text = text.replace(l, newLink);
                }
            }
            postData += `<lb></lb>${text.replaceAll(/\n/g, '<lb></lb>')}`;
            postData += '</message><lb></lb><lb></lb>\n';
            xml += postData;
        }
        xml += `</Text>`;
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${filename}.xml`;
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    function downloadTxt(filename) {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        dlConfirmBtn.textContent = '';
        dlConfirmBtn.appendChild(spinner);
        spinner.style.display = 'inline-block';
        let txt = '';
        for (let p of posts) {
            let postData = p['record-text'];
            postData += '\n\n';
            txt += postData;
        }
        const blob = new Blob([txt], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${filename}.txt`;
        spinner.remove();
        dlConfirmBtn.textContent = 'Download';
        anchor.click();
    }

    async function downloadXlsx(filename) {
        let widths = [];
        Object.keys(posts[0]).forEach((key) => {
            widths.push({ key: key, widths: [] });
        });
        for (let p of posts) {
            for (let [key, value] of Object.entries(p)) {
                if (value) {
                    let vString = value.toString();
                    widths
                        .find((w) => w.key === key)
                        .widths.push(key.length, vString.length);
                }
            }
        }
        widths = widths.map((w) => {
            w.widths.sort((a, b) => b - a);
            return w.widths[0];
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(filename);
        worksheet.columns = Object.keys(posts[0]).map((key) => {
            return { header: key, key: key, width: widths.shift() };
        });

        const rows = [];
        function isDate(value) {
            const regexp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3}Z)?/;
            return regexp.test(value);
        }
        for (let p of posts) {
            let row = [];
            for (let [key, value] of Object.entries(p)) {
                if (isDate(value)) {
                    value = new Date(value);
                } else if (key === 'url') {
                    value = {
                        text: value,
                        hyperlink: value,
                        tooltip: 'Link to message',
                    };
                }
                row.push(value);
            }
            rows.push(row);
        }
        const tableCheckbox = document.getElementById('table-checkbox');
        if (tableCheckbox.checked) {
            worksheet.addTable({
                name: filename,
                ref: 'A1',
                headerRow: true,
                totalsRow: false,
                style: {
                    theme: 'TableStyleMedium9',
                    showRowStripes: true,
                },
                columns: worksheet.columns.map((col) => ({
                    name: col.header,
                    filterButton: true,
                })),
                rows: rows,
            });
        } else {
            worksheet.addRows(rows);
        }
        const urlCol = worksheet.getColumn('url');
        if (urlCol) {
            urlCol.eachCell(function (cell) {
                if (cell.value && cell.value.hyperlink) {
                    cell.style = {
                        font: { color: { argb: 'ff0000ff' }, underline: true },
                    };
                }
            });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${filename}.xlsx`;
        anchor.click();
    }
});
