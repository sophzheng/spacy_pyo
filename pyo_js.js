// init Pyodide
async function pyodide_loader() {
  let pyodide_premise = loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.21.0a2/full/",
  });
  let pyodide = await pyodide_premise;
  await pyodide.loadPackage(["micropip", "numpy", "pydantic"]);
  return pyodide_premise;
}

let pyodideReadyPromise = pyodide_loader();

// run Python code and load SpaCy
async function load_packages(text) {
  let pyodide = await pyodideReadyPromise;
  pyodide.globals.set("text", text);
  message.innerText = "Analyzing Webpage...";
  let output = pyodide
    .runPythonAsync(
      `
      import importlib
      import micropip
      from pyodide import to_js, http, JsProxy
      
      await micropip.install(["exodide",
                              "wasabi", "catalogue", "typer", "pathy",
                              "tqdm", "requests", "jinja2",
                              "langcodes", "typing_extensions"])
      from exodide.install import fetch_install
      pkg = ["blis-0.7.8",
             "cymem-2.0.6",
             "murmurhash-1.0.7",
             "preshed-3.0.6",
             "srsly-2.4.3",
             "thinc-8.1.0",
             "spacy-3.4.0"]
      
      for p in pkg:
          await fetch_install(f"{p}-cp310-cp310-emscripten_wasm32.whl")
      await fetch_install("en_core_web_sm-3.4.0-py3-none-any.whl")
      
      import spacy
      nlp = spacy.load("en_core_web_sm")

      def tokenize(sentence):
        locations = []
        doc = nlp(sentence)
        for ent in doc.ents:
          if ent.label_ in ["GPE", "LOC"]:
            locations.append(ent.text)
        return locations
        
      tokenize(text)
  `
    )
    .then((output) => (message.innerText = output));

  //console.log(output);
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.action == "getSource") {
    console.log(request.source);
    load_packages(request.source);
  }
});

/*function onWindowLoad(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

        // since only one tab should be active and in the current window at once
        // the return variable should only have one entry
        console.log('test0')
        var activeTab = tabs[0];
        var activeTabId = activeTab.url; // or do whatever you need
        console.log(activeTabId)
        load_packages(activeTabId)
        chrome.runtime.sendMessage({
            action: "getSource",
            source: activeTabId
        });
    
     });
  }*/

function onWindowLoad() {
  var message = document.querySelector("#message");

  chrome.tabs.executeScript(
    null,
    {
      file: "getPagesSource.js",
    },
    function () {
      // If you try and inject into an extensions page or the webstore/NTP you'll get an error
      if (chrome.runtime.lastError) {
        message.innerText =
          "There was an error injecting script : \n" +
          chrome.runtime.lastError.message;
      }
    }
  );
}

window.onload = onWindowLoad;
//load_packages()
