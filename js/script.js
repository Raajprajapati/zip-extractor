
var file;//input zip file
var count = 0; //count of the extracted files
var filesList = []; //list of the downloadable file links
var dir = {}; //directory structure of the jstree and extracted files

 

// reset the value of file input when clicked 
$("#input").click( () =>{
	$("#file").val("");
});

// error box closing 
$("#close").click(()=>{
	location.reload()
})

// getting the dragged file to extract
$("#input").on("dragover",(e)=> {
    e.preventDefault()
  }).on("drop", (e)=> {
	e.preventDefault()
    file = e.originalEvent.dataTransfer.files[0]
	extractFiles(file)
  });

// listen for any file change in the file input bar
$("#file").change((e) => {
	file = e.target.files[0];
	extractFiles(file);

});

// save all the files when clicked on save all button
$("#save_file").click(() =>{
	filesList.map(elem => {
		setTimeout(downloadFile(elem.url, elem.filename), 100);
	})

});


// update the screen to accept files for the extraction
$("#extract").click(()=> {
	location.reload();
});

// downloads the on which clicked
$('#jstree').on("select_node.jstree", (e, data) =>{
	let id = data.node.id;
	let url = document.getElementById(id).dataset.link;
	let filename = document.getElementById(id).innerText;
	let downloadable = document.getElementById(id).classList.contains("downloadable");
	downloadable ? downloadFile(url, filename) : null;
});

// func to check progress of the extracted files
const checkProgress = (x, y) => {
	setProgress(x, y);
	if (x == y) {
		$("#loading_wrapper").css("display", "none");
		$("#jstree").css("display", "block");
		$("#success").css("display", "block");
		$("#action_btns").css("display", "flex");
		$("#jstree").jstree();
	}
}

// func to download  the file with url and name provided
const downloadFile = (url, name) => {
	var link = document.createElement("a");
	link.setAttribute("download", name);
	link.href = url;
	document.body.appendChild(link);
	link.click();
	link.remove();
}


// func to set the progress in progress bar
const setProgress = (x, len) => {
	let percent = Math.round((x / len) * 100);
	let loading = document.getElementById("loading");
	loading.style.width =`${percent}%`;
	loading.innerText = `${percent}%`;
}

// creates and append the directory structure of the extracted files to the jstree
const createDir = (name, dirObject, parentDir) => {
	let currentDir = "";
		for (let i = 0; i < name.length; i++) {
			if (name[i] == "/") {
				if (!dirObject[currentDir]) {
					dirObject[currentDir] = {};
					let ul = document.createElement("ul");
					let li = document.createElement("li");
					li.dataset.jstree = '{"icon":"../imgs/folder.png"}';
					li.innerText = currentDir;
					if (parentDir) {
						li.id = `${parentDir}-${currentDir}`;
						ul.id = `ul-${parentDir}-${currentDir}`;
						li.append(ul);
						document.getElementById(`ul-${parentDir}`).append(li);
						parentDir = `${parentDir}-${currentDir}`;

					} else {
						li.id = currentDir;
						ul.id = `ul-${currentDir}`;
						parentDir = currentDir;
						li.append(ul);
						$("#root").append(li);
					}
				}
				else {
					if (parentDir) {
						parentDir = `${parentDir}-${currentDir}`;
					} else {
						parentDir = currentDir;
					}
				}
				createDir(name.slice(i + 1, name.length), dirObject[currentDir], parentDir);
				break;
			}
			else {
				currentDir += name[i];
			}
		}

}

// returns the downloadable url of extracted file 
const getFileLink = async (val) => {
	const fileBlob = await val.getData(new zip.BlobWriter("application/octet-stream"));
	const url = URL.createObjectURL(fileBlob);
	return url;

}

// append the file to the jstree
const addFile = async (val, len) => {
	let link = await getFileLink(val);
	const name = val.filename;
	let haveParent = 0;
	let dirID = "";
	let filename;
	for (i = name.length - 1; i >= 0; i--) {
		if (name[i] == "/") {
			haveParent = 1;
			let dirName = name.slice(0, i);
			filename = name.slice(i + 1, name.length);
			for (i = 0; i <= dirName.length - 1; i++) {
				if (name[i] == "/") {
					dirID += "-";
				} else {
					dirID += dirName[i];
				}
			}
			break;
		}
	}
	let li = document.createElement("li");
	li.dataset.jstree = '{"icon":"../imgs/file.png"}';
	li.dataset.link = link;
	li.id = name;
	li.classList.add("downloadable");

	if (haveParent) {
		li.innerText = filename;
		filesList.push({ url: link, filename: filename });
		document.getElementById(`ul-${dirID}`).append(li);
	} else {
		filesList.push({ url: link, filename: name });
		li.innerText = name;
		$("#root").append(li);
	}
	count += 1;
	checkProgress(count, len);

}

// func to start the extraction of zip file provided
const extractFiles = async (file) => {
	try{
		$("#input").css("display", "none");
		$("#loading_wrapper").css("display", "block");
		const reader = new zip.ZipReader(new zip.BlobReader(file));
		// get all entries from the zip
		const entries = await reader.getEntries();
		let len = entries.length;//count of the total entries or files
	
		// performing on entries 
		entries.map((val) => {
			if (val.directory) {
				count += 1;
				checkProgress(count, len);
				createDir(val.filename, dir, "");
			}
			else {
				addFile(val, len);
			}
		})
	}
	catch(err){	
		$("#error").css("display","flex");
	}
}





	