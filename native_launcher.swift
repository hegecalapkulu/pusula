import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var serverProcess: Process?

    func applicationDidFinishLaunching(_ notification: Notification) {
        startServerIfNeeded()

        // 1300 x 850 boyutunda pencere
        let screenSize = NSScreen.main?.visibleFrame.size ?? CGSize(width: 1440, height: 900)
        let initialWidth = min(1340, screenSize.width * 0.92)
        let initialHeight = min(880, screenSize.height * 0.92)
        let rect = NSRect(
            x: (screenSize.width - initialWidth) / 2,
            y: (screenSize.height - initialHeight) / 2,
            width: initialWidth,
            height: initialHeight
        )

        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Pusulapp — Sürdürülebilir Hayat & Hedef Planlayıcı"
        window.minSize = NSSize(width: 980, height: 680)
        window.center()
        window.isReleasedWhenClosed = false
        window.delegate = self

        // WKWebView konfigürasyonu
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        // Medya ve seslerin sorunsuz çalışması
        config.mediaTypesRequiringUserActionForPlayback = []

        // Web verilerinin (localStorage) kalıcı olması için standart default veri deposu
        config.websiteDataStore = WKWebsiteDataStore.default()

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        window.contentView?.addSubview(webView)

        // Arka plan koyu tema uyumu
        webView.setValue(false, forKey: "drawsBackground")
        window.backgroundColor = NSColor(red: 0.08, green: 0.10, blue: 0.14, alpha: 1.0)

        // Sunucunun açılması için kısa gecikme ile yükle
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            if let url = URL(string: "http://localhost:8420") {
                let req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 10)
                self?.webView.load(req)
            }
        }

        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    func startServerIfNeeded() {
        let appDir = "/Users/hegecalapkulu/.gemini/antigravity/scratch/hayat-planlayici"
        let scriptPath = "\(appDir)/server.py"

        // Port 8420 dinleniyor mu kontrol et
        let checkTask = Process()
        checkTask.executableURL = URL(fileURLWithPath: "/usr/sbin/lsof")
        checkTask.arguments = ["-i", ":8420"]
        let pipe = Pipe()
        checkTask.standardOutput = pipe
        checkTask.standardError = Pipe()
        try? checkTask.run()
        checkTask.waitUntilExit()

        if checkTask.terminationStatus != 0 {
            // Port boşta, sunucuyu arka planda başlat
            let proc = Process()
            proc.executableURL = URL(fileURLWithPath: "/usr/bin/python3")
            proc.arguments = [scriptPath, "--no-browser"]
            proc.currentDirectoryURL = URL(fileURLWithPath: appDir)
            try? proc.run()
            self.serverProcess = proc
        }
    }

    func windowWillClose(_ notification: Notification) {
        // Pencere kapandığında uygulamayı tamamen kapat
        NSApp.terminate(nil)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
