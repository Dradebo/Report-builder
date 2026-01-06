const config = {
    type: 'app',
    name: "report-builder",
    title: "Report Builder",
    description: "Report Builder App",
    coreApp: false,
    entryPoints: {
        app: './src/App.js',
    },
    proxy: {
        target: 'https://dev.emisuganda.org/emisdev',
        changeOrigin: true
    }
}

module.exports = config
