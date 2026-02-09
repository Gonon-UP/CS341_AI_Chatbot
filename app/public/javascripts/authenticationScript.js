// ===============================
// Google Drive OAuth Integration
// ===============================

let accessToken = null;
let tokenClient = null;

window.addEventListener("load", () => {
    tokenClient = google.accounts.oauth2.initTokenClient({
        // copied and pasted from Google Authentication site (ask Indiana)
        client_id: "915798649525-1c1v87b5gvrnq992gr4jriuqb88qb89o.apps.googleusercontent.com",
        // allows us to read files from Google Drive
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (resp) => {
            accessToken = resp.access_token;
            document.getElementById("driveStatus").textContent =
                "✓ Connected to Google Drive";
                
            // Hide the login button
            const btn = document.getElementById("googleDriveLogin");
            btn.style.display = "none";

            // Show the details of the Google Drive
            const status = document.getElementById("driveStatus");
            status.style.display = "block";

            listDriveFiles();
        }
    });

    document
        .getElementById("googleDriveLogin")
        .addEventListener("click", () => {
            tokenClient.requestAccessToken();
        });
});


// Example: list user files
async function listDriveFiles() {
    const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?pageSize=5&fields=files(id,name)",
        {
            headers: { Authorization: "Bearer " + accessToken }
        }
    );

    const data = await res.json();
    console.log("Drive files:", data.files);

    const container = document.getElementById("driveStatus");
    container.innerHTML += "<br><br><b>Recent Files:</b><br>";

    if (!data.files || data.files.length === 0) {
        container.innerHTML += "No files found for this app.";
        return;
    }

    data.files.forEach(file => {
        container.innerHTML += "- " + file.name + "<br>";
    });
}