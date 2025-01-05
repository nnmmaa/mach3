if (typeof window.mraid === 'undefined') {
    window.mraid = {
        getState: () => 'loading',
        isViewable: () => false,
        open: (url) => console.log('[Stub] mraid.open:', url),
        setOrientationProperties: (props) => console.log('[Stub] setOrientationProperties:', props),
        addEventListener: (event, callback) => console.log('[Stub] addEventListener:', event),
        getParameter: (param) => {
            console.log(`[Stub] getParameter(${param}) called`);
            return 'https://yourgame.com';
        },
    };
}