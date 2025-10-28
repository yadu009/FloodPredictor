// Random resource data
const resourcesData = [
    {title: "Annual Flood Report 2024", desc: "Comprehensive report on last year's flood events and predictions.", type: "pdf"},
    {title: "Hydrology Dataset", desc: "Historical river discharge, rainfall, and water level dataset.", type: "csv"},
    {title: "Flood Safety Guide", desc: "Official guidelines to stay safe during floods.", type: "pdf"},
    {title: "External Links", desc: "Links to government and NGO flood preparedness sites.", type: "link", url: "https://www.who.int/"},
    {title: "Urban Flood Risk Map", desc: "Visual analysis of urban flood-prone areas.", type: "pdf"},
    {title: "River Basin Study", desc: "Data-driven study of major river basins.", type: "csv"}
];

const grid = document.getElementById("resources-grid");

resourcesData.forEach(resource => {
    const card = document.createElement("div");
    card.className = "resource-card";

    const title = document.createElement("h3");
    title.innerText = resource.title;

    const desc = document.createElement("p");
    desc.innerText = resource.desc;

    const btn = document.createElement("a");
    btn.className = "download-btn";

    if(resource.type === "link"){
        btn.href = resource.url;
        btn.target = "_blank";
        btn.innerText = "Visit";
    } else if(resource.type === "pdf"){
        btn.href = "#";
        btn.innerText = "Download PDF";
    } else if(resource.type === "csv"){
        btn.href = "#";
        btn.innerText = "Download CSV";
    }

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(btn);

    grid.appendChild(card);
});

console.log("Resources page loaded with dynamic content.");
