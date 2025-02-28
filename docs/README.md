![ds_logo](https://github.com/user-attachments/assets/de974d79-5c2d-4ad3-973a-5d13c1534c46)  

A browser add-on to collect Discord messages for text mining and discourse analysis.  
⚠️ Use of this tool is subject to basic ethics and local data protection and intellectual property legislation.

# Download and install
## Firefox
[![Firefox add-on](https://github.com/user-attachments/assets/855e2e46-2b44-42d7-bba5-f2a2fbb7e88b)](https://github.com/fmoncomble/discordscraper/releases/latest/download/discordscraper.xpi)

## Chromium-based browsers
While the add-on is in beta testing:
- Download the repository as a zip file
- Unzip into a folder on your computer
- Open `chrome://extensions` (or similar depending on your browser)
- Toggle Developer mode
- Click `Load unpacked extension`
- Select the unzipped folder

* Remember to pin the add-on to the toolbar

# Instructions for use
## Authentication
- On first use, click the `Get token` button. This will take you to the Discord web app in a new tab, where you will need to be logged in.
- On your Discord home page, right-click your avatar in the bottom-left corner, then click `Copy user token`.
- If successful, this will close the Discord tab and bring you back to Discord Scraper to paste your token in the appropriate field.

## Collecting messages
- Once your token has been pasted, you should see a dropdown menu of the servers where you are a member, and a second dropdown of the selected server's channels.
- Choose a server and a channel, then click `Start` to start collecting messages. You can click `Stop` at any time to interrupt the process.
    - ⚠️ All of a given server's channels are displayed in the channels dropdown, including some to which you may not have access. Make sure to choose a channel you are a member of.
- Once done, click `Download` to display a dialog to select which metadata you want to include in the resulting file. By default, `content`, `timestamp` and `username` are checked.
- Choose a file format
    - (`XML/XTZ` creates an XML file specially formatted for import into [TXM](https://txm.gitpages.huma-num.fr/textometrie/index.html). On import, make sure to click the `Textual planes` item and type `ref` in the `Out of text to include` section.)
- Click `Download` to retrieve the file.
