#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  applyCodexServiceTierConfigFallbackPatch,
  applyCodexServiceTierManagerConfigFallbackPatch,
  applyLinuxFileManagerPatch,
  applyLinuxMenuPatch,
  applyLinuxOpaqueBackgroundPatch,
  applyLinuxSetIconPatch,
  applyLinuxSingleInstancePatch,
  applyLinuxTrayPatch,
  applyLinuxWindowOptionsPatch,
  patchMainBundleSource,
  patchExtractedApp,
} = require("./patch-linux-window-ui.js");

const mainBundlePrefix =
  "let n=require(`electron`),i=require(`node:path`),o=require(`node:fs`);";
const fileManagerBundle =
  "var lu=jl({id:`fileManager`,label:`Finder`,icon:`apps/finder.png`,kind:`fileManager`,darwin:{detect:()=>`open`,args:e=>il(e)},win32:{label:`File Explorer`,icon:`apps/file-explorer.png`,detect:uu,args:e=>il(e),open:async({path:e})=>du(e)}});function uu(){}";
const alreadyOpaqueBackgroundBundle =
  "process.platform===`linux`?{backgroundColor:e?t:n,backgroundMaterial:null}:{backgroundColor:r,backgroundMaterial:null}";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyPatchTwice(patchFn, source, ...args) {
  const patched = patchFn(source, ...args);
  assert.equal(patchFn(patched, ...args), patched);
  return patched;
}

function trayBundleFixture() {
  return [
    "async function Hw(e){return process.platform!==`win32`&&process.platform!==`darwin`?null:(zw=!0,Lw??Rw??(Rw=(async()=>{let r=await Ww(e.buildFlavor,e.repoRoot),i=new n.Tray(r.defaultIcon);return i})()))}",
    "async function Ww(e,t){if(process.platform===`darwin`){return null}let r=process.platform===`win32`?`.ico`:`.png`,a=Nw(e,process.platform),o=[...n.app.isPackaged?[(0,i.join)(process.resourcesPath,`${a}${r}`)]:[],(0,i.join)(t,`electron`,`src`,`icons`,`${a}${r}`)];for(let e of o){let t=n.nativeImage.createFromPath(e);if(!t.isEmpty())return{defaultIcon:t,chronicleRunningIcon:null}}return{defaultIcon:await n.app.getFileIcon(process.execPath,{size:process.platform===`win32`?`small`:`normal`}),chronicleRunningIcon:null}}",
    "var pb=class{trayMenuThreads={runningThreads:[],unreadThreads:[],pinnedThreads:[],recentThreads:[],usageLimits:[]};constructor(){this.tray={on(){},setContextMenu(){},popUpContextMenu(){}};this.onTrayButtonClick=()=>{};this.tray.on(`click`,()=>{this.onTrayButtonClick()}),this.tray.on(`right-click`,()=>{this.openNativeTrayMenu()})}async handleMessage(e){switch(e.type){case`tray-menu-threads-changed`:this.trayMenuThreads=e.trayMenuThreads;return}}openNativeTrayMenu(){this.updateChronicleTrayIcon();let e=n.Menu.buildFromTemplate(this.getNativeTrayMenuItems());e.once(`menu-will-show`,()=>{this.isNativeTrayMenuOpen=!0}),e.once(`menu-will-close`,()=>{this.isNativeTrayMenuOpen=!1,this.handleNativeTrayMenuClosed()}),this.tray.popUpContextMenu(e)}updateChronicleTrayIcon(){}getNativeTrayMenuItems(){return[]}}",
    "v&&k.on(`close`,e=>{this.persistPrimaryWindowBounds(k,f);let t=this.getPrimaryWindows(f).some(e=>e!==k);if(process.platform===`win32`&&f===`local`&&!this.isAppQuitting&&this.options.canHideLastLocalWindowToTray?.()===!0&&!t){e.preventDefault(),k.hide();return}if(process.platform===`darwin`&&!this.isAppQuitting&&!t){e.preventDefault(),k.hide()}});",
    "let E=process.platform===`win32`;E&&oe();",
  ].join("");
}

function singleInstanceBundleFixture() {
  return [
    "agentRunId:process.env.CODEX_ELECTRON_AGENT_RUN_ID?.trim()||null}});let A=Date.now();await n.app.whenReady();",
    "l(e=>{R.deepLinks.queueProcessArgs(e)||ie()});let ae=",
  ].join("");
}

function serviceTierBundleFixture() {
  return [
    "async function wB({activeCollaborationMode:e,agentMode:t,currentLocalExecutionCwd:n,currentLocalExecutionHostId:r,onCreateError:i,onLocalConversationCreated:a,serviceTier:o,setSelectedCollaborationMode:s,startRealtimeConversationPage:c,workspaceRootsForLocalExecution:l}){let u=bg(l);try{let i=await Sg(l),d=i.workspaceRoots,f=i.cwd??n,{config:p}=await ri(`read-config-for-host`,{hostId:r,includeLayers:!1,cwd:f}),m=Lt(t,d,Rr(p)),h=await ri(`start-conversation`,{hostId:r,input:[],cwd:f,workspaceRoots:d,workspaceKind:u?`projectless`:`project`,collaborationMode:e,serviceTier:o,permissions:m,approvalsReviewer:m.approvalsReviewer});return h}catch(e){}}",
    "function kH({agentMode:e,workspaceRoots:t,config:n,input:r,commentAttachments:i,collaborationMode:a,serviceTier:o,cwd:s,fileAttachments:c,addedFiles:l,memoryPreferences:u,workspaceKind:d=`project`,projectlessOutputDirectory:f}){let p=(0,OH.default)([...c,...l],NT.default),m=Lt(e,t,n);return{input:r,commentAttachments:i,workspaceRoots:t,collaborationMode:a,...o===void 0?{}:{serviceTier:o},permissions:m,approvalsReviewer:m.approvalsReviewer,cwd:s,attachments:p}}",
    "async function yW({context:e,prompt:t,workspaceRoots:n,cwd:r,hostId:i,agentMode:a,serviceTier:o,collaborationMode:s,memoryPreferences:c,workspaceKind:l=`project`,projectlessOutputDirectory:u}){let d=[{type:`text`,text:t,text_elements:[]},...vW(e,i!==_e)],{config:f}=await ri(`read-config-for-host`,{hostId:i,includeLayers:!1,cwd:r});return{input:d,commentAttachments:e.commentAttachments,workspaceRoots:n,cwd:r,fileAttachments:e.fileAttachments,addedFiles:e.addedFiles,agentMode:a,model:null,serviceTier:o,reasoningEffort:null,collaborationMode:s,config:Rr(f),memoryPreferences:c,workspaceKind:l}}",
    "async function q0({appServerManager:e,projectRoot:t,canStartWorktree:n,gitBranchName:r,agentMode:i,collaborationMode:a,serviceTier:o,createPendingWorktree:s,suggestion:c,navigate:l,onLocalConversationCreated:u}){if(c.threadAction.type===`continue-thread`){let t=mt(c.threadAction.threadId);await Or(e,{conversationId:t,model:null,serviceTier:o,reasoningEffort:a.settings.reasoning_effort,workspaceRoots:f,collaborationMode:a});let r=Lt(i,f,await hr(d,n));await Mi(e,t,{cwd:n,approvalPolicy:r.approvalPolicy,approvalsReviewer:r.approvalsReviewer,sandboxPolicy:r.sandboxPolicy,serviceTier:o,effort:null,input:m,attachments:[],collaborationMode:a});return}let _=await hr(d,g),v={input:m,workspaceRoots:h.workspaceRoots,cwd:g,fileAttachments:[],addedFiles:[],agentMode:i,model:null,serviceTier:o,reasoningEffort:null,collaborationMode:a,config:_};return kH(v)}",
  ].join("");
}

function serviceTierManagerBundleFixture() {
  return [
    "async function sm(e,t,n){let{beforeSendRequest:r,inheritThreadSettings:o=!0,...s}=n,c=e.getConversation(t),E=Np({cwd:s.cwd??p.cwd,fallbackCwd:T,workspaceBrowserRoot:p.workspaceBrowserRoot,workspaceKind:p.workspaceKind}),D=Fp({sandboxPolicy:C,workspaceKind:p.workspaceKind}),O=p.workspaceKind===`projectless`||s.approvalPolicy!=null||s.sandboxPolicy!=null,ee=e.getPersonality(),te=s.serviceTier===void 0?e.getEffectiveServiceTier(Lc()):e.getEffectiveServiceTier(s.serviceTier),k={threadId:t,input:s.input,cwd:E,serviceTier:te}}",
    "var Manager=class{async buildNewConversationParams(e,t,n,r,i,a){let o=await he(e,this.getEffectiveServiceTier(t),()=>this.fetchFromHost(`get-copilot-api-proxy-info`),n,r,async()=>(await this.fetchFromHost(`mcp-codex-config`,{params:{cwd:n}})).config,this.personality,i,{persistExtendedHistory:a?.persistExtendedHistory??!0});return o}}",
  ].join("");
}

test("adds Linux file manager support without relying on exact minified variable names", () => {
  const source = `${mainBundlePrefix}${fileManagerBundle}`;

  const patched = applyPatchTwice(applyLinuxFileManagerPatch, source);

  assert.match(patched, /linux:\{label:`File Manager`/);
  assert.match(patched, /detect:\(\)=>`linux-file-manager`/);
  assert.match(patched, /n\.shell\.openPath\(__codexOpenTarget\)/);
});

test("adds Linux menu hiding next to Windows removeMenu calls", () => {
  const source = "process.platform===`win32`&&k.removeMenu(),k.on(`closed`,()=>{})";
  const patched = applyPatchTwice(applyLinuxMenuPatch, source);

  assert.equal(
    patched,
    "process.platform===`linux`&&k.setMenuBarVisibility(!1),process.platform===`win32`&&k.removeMenu(),k.on(`closed`,()=>{})",
  );
});

test("recognizes already-applied Linux opaque background patch", () => {
  const patched = applyPatchTwice(applyLinuxOpaqueBackgroundPatch, alreadyOpaqueBackgroundBundle);
  assert.equal(patched, alreadyOpaqueBackgroundBundle);
});

test("adds Linux window icon handling when an icon asset is available", () => {
  const iconAsset = "app-test.png";
  const iconPathExpression = "process.resourcesPath+`/../content/webview/assets/app-test.png`";
  const windowOptionsSource = "...process.platform===`win32`?{autoHideMenuBar:!0}:{},";
  const readyToShowSource = "D.once(`ready-to-show`,()=>{})";

  const patchedWindowOptions = applyPatchTwice(
    applyLinuxWindowOptionsPatch,
    windowOptionsSource,
    iconAsset,
  );
  const patchedSetIcon = applyPatchTwice(applyLinuxSetIconPatch, readyToShowSource, iconAsset);
  const patchedMain = applyPatchTwice(
    patchMainBundleSource,
    [
      mainBundlePrefix,
      windowOptionsSource,
      "process.platform===`win32`&&k.removeMenu(),",
      readyToShowSource,
      alreadyOpaqueBackgroundBundle,
      fileManagerBundle,
      trayBundleFixture(),
      singleInstanceBundleFixture(),
    ].join(""),
    iconAsset,
  );

  assert.match(patchedWindowOptions, /process\.platform===`win32`\|\|process\.platform===`linux`/);
  assert.match(patchedWindowOptions, new RegExp(`icon:${escapeRegExp(iconPathExpression)}`));
  assert.equal(
    patchedSetIcon,
    `process.platform===\`linux\`&&D.setIcon(${iconPathExpression}),${readyToShowSource}`,
  );
  assert.match(patchedMain, new RegExp(`icon:${escapeRegExp(iconPathExpression)}`));
  assert.match(patchedMain, new RegExp(`D\\.setIcon\\(${escapeRegExp(iconPathExpression)}\\)`));
});

test("adds Linux tray support including the platform guard", () => {
  const iconPathExpression = "process.resourcesPath+`/../content/webview/assets/app-test.png`";
  const patched = applyPatchTwice(applyLinuxTrayPatch, trayBundleFixture(), iconPathExpression);

  assert.match(
    patched,
    /process\.platform!==`win32`&&process\.platform!==`darwin`&&process\.platform!==`linux`\?null:/,
  );
  assert.match(
    patched,
    new RegExp(`nativeImage\\.createFromPath\\(${escapeRegExp(iconPathExpression)}\\)`),
  );
  assert.match(patched, /\(process\.platform===`win32`\|\|process\.platform===`linux`\)&&f===`local`/);
  assert.match(patched, /setLinuxTrayContextMenu\(\)\{let e=n\.Menu\.buildFromTemplate/);
  assert.match(
    patched,
    /process\.platform===`linux`&&this\.setLinuxTrayContextMenu\(\),this\.tray\.on\(`click`/,
  );
  assert.match(patched, /if\(process\.platform===`linux`\)return;e\.once\(`menu-will-show`/);
  assert.match(patched, /\(E\|\|process\.platform===`linux`\)&&oe\(\);/);
});

test("adds Linux single-instance lock and second-instance handoff", () => {
  const patched = applyPatchTwice(applyLinuxSingleInstancePatch, singleInstanceBundleFixture());

  assert.match(patched, /process\.platform===`linux`&&!n\.app\.requestSingleInstanceLock\(\)/);
  assert.match(patched, /n\.app\.quit\(\);return/);
  assert.match(patched, /codexLinuxSecondInstanceHandler/);
  assert.match(patched, /n\.app\.on\(`second-instance`,codexLinuxSecondInstanceHandler\)/);
  assert.match(patched, /n\.app\.off\(`second-instance`,codexLinuxSecondInstanceHandler\)/);
});

test("adds service tier config fallback for App-created local requests", () => {
  const patched = applyPatchTwice(applyCodexServiceTierConfigFallbackPatch, serviceTierBundleFixture());

  assert.match(patched, /serviceTier:o\?\?f\?\.service_tier\?\?void 0/);
  assert.match(patched, /serviceTier:o\?\?p\?\.service_tier\?\?void 0/);
  assert.match(
    patched,
    /\.\.\.o==null&&n\?\.service_tier==null\?\{\}:\{serviceTier:o\?\?n\?\.service_tier\}/,
  );
  assert.match(patched, /serviceTier:o\?\?_\?\.service_tier\?\?void 0/);
  assert.match(patched, /conversationId:t,model:null,serviceTier:o\?\?void 0/);
  assert.match(patched, /sandboxPolicy:r\.sandboxPolicy,serviceTier:o\?\?void 0/);
  assert.doesNotMatch(patched, /serviceTier:o,reasoningEffort:null,collaborationMode:s,config:Rr\(f\)/);
  assert.doesNotMatch(patched, /\.\.\.o===void 0\?\{\}:\{serviceTier:o\}/);
});

test("adds service tier config fallback inside the app-server manager", () => {
  const patched = applyPatchTwice(
    applyCodexServiceTierManagerConfigFallbackPatch,
    serviceTierManagerBundleFixture(),
  );

  assert.match(
    patched,
    /__codexBuildConfig=t==null\?await Qf\(this\.requestClient,n\):null/,
  );
  assert.match(
    patched,
    /this\.getEffectiveServiceTier\(t\?\?__codexBuildConfig\?\.service_tier\)/,
  );
  assert.match(
    patched,
    /__codexTurnConfig=s\.serviceTier==null\?await Qf\(e\.requestClient,E\):null/,
  );
  assert.match(
    patched,
    /s\.serviceTier==null\?e\.getEffectiveServiceTier\(Lc\(\)\?\?__codexTurnConfig\?\.service_tier\):e\.getEffectiveServiceTier\(s\.serviceTier\)/,
  );
  assert.doesNotMatch(
    patched,
    /te=s\.serviceTier===void 0\?e\.getEffectiveServiceTier\(Lc\(\)\):e\.getEffectiveServiceTier\(s\.serviceTier\)/,
  );
});

test("patchMainBundleSource keeps non-icon patches active without an icon asset", () => {
  const source = [
    mainBundlePrefix,
    "process.platform===`win32`&&k.removeMenu(),",
    alreadyOpaqueBackgroundBundle,
    fileManagerBundle,
    trayBundleFixture(),
    singleInstanceBundleFixture(),
  ].join("");

  const patched = applyPatchTwice(patchMainBundleSource, source, null);

  assert.match(patched, /process\.platform===`linux`&&k\.setMenuBarVisibility\(!1\)/);
  assert.match(patched, /linux:\{label:`File Manager`/);
  assert.match(
    patched,
    /process\.platform!==`win32`&&process\.platform!==`darwin`&&process\.platform!==`linux`\?null:/,
  );
  assert.match(patched, /process\.platform===`linux`&&!n\.app\.requestSingleInstanceLock\(\)/);
  assert.doesNotMatch(patched, /setIcon\(process\.resourcesPath\+`\/\.\.\/content\/webview\/assets\//);
  assert.doesNotMatch(
    patched,
    /nativeImage\.createFromPath\(process\.resourcesPath\+`\/\.\.\/content\/webview\/assets\//,
  );
});

test("missing icon asset skips only icon patches", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "codex-patch-test-"));
  try {
    const buildDir = path.join(tempRoot, ".vite", "build");
    const assetsDir = path.join(tempRoot, "webview", "assets");
    fs.mkdirSync(buildDir, { recursive: true });
    fs.mkdirSync(assetsDir, { recursive: true });
    fs.writeFileSync(
      path.join(buildDir, "main.js"),
      [
        mainBundlePrefix,
        "process.platform===`win32`&&k.removeMenu(),",
        alreadyOpaqueBackgroundBundle,
        fileManagerBundle,
        trayBundleFixture(),
        singleInstanceBundleFixture(),
      ].join(""),
    );
    for (const name of [
      "code-theme-test.js",
      "general-settings-test.js",
      "index-test.js",
      "use-resolved-theme-variant-test.js",
    ]) {
      fs.writeFileSync(
        path.join(assetsDir, name),
        `${serviceTierBundleFixture()}opaqueWindows:e?.opaqueWindows??n.opaqueWindows,semanticColors:`,
      );
    }
    fs.writeFileSync(path.join(tempRoot, "package.json"), JSON.stringify({ name: "codex" }));
    fs.writeFileSync(
      path.join(assetsDir, "app-server-manager-signals-test.js"),
      serviceTierManagerBundleFixture(),
    );

    patchExtractedApp(tempRoot);

    const patchedMainPath = path.join(buildDir, "main.js");
    const patchedThemePath = path.join(assetsDir, "use-resolved-theme-variant-test.js");
    const patchedPackagePath = path.join(tempRoot, "package.json");
    const patchedMain = fs.readFileSync(patchedMainPath, "utf8");
    const patchedTheme = fs.readFileSync(patchedThemePath, "utf8");
    const patchedIndex = fs.readFileSync(path.join(assetsDir, "index-test.js"), "utf8");
    const patchedManager = fs.readFileSync(
      path.join(assetsDir, "app-server-manager-signals-test.js"),
      "utf8",
    );
    const patchedPackageRaw = fs.readFileSync(patchedPackagePath, "utf8");
    const patchedPackage = JSON.parse(patchedPackageRaw);

    patchExtractedApp(tempRoot);

    assert.match(patchedMain, /linux:\{label:`File Manager`/);
    assert.match(patchedTheme, /includes\(`linux`\)/);
    assert.match(patchedIndex, /serviceTier:o\?\?f\?\.service_tier\?\?void 0/);
    assert.match(patchedManager, /__codexTurnConfig=s\.serviceTier==null/);
    assert.equal(patchedPackage.desktopName, "codex-desktop.desktop");
    assert.equal(fs.readFileSync(patchedMainPath, "utf8"), patchedMain);
    assert.equal(fs.readFileSync(patchedThemePath, "utf8"), patchedTheme);
    assert.equal(fs.readFileSync(patchedPackagePath, "utf8"), patchedPackageRaw);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
