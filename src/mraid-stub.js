if (typeof window.mraid === 'undefined') {
    window.mraid = {
        state: 'loading', // Состояние MRAID: 'loading', 'default', 'expanded', 'hidden'
        viewable: false, // Указывает, видим ли баннер
        parameters: { clickURL: 'https://example.com/install' }, // Эмуляция параметров

        // Метод getState
        getState: function () {
            return this.state;
        },

        // Метод isViewable
        isViewable: function () {
            return this.viewable;
        },

        // Метод open
        open: function (url) {
            console.log('[Stub] mraid.open:', url);
            window.open(url, '_blank'); // Для имитации открытия ссылки
        },

        // Метод setOrientationProperties
        setOrientationProperties: function (props) {
            console.log('[Stub] setOrientationProperties:', props);
        },

        // Метод addEventListener
        addEventListener: function (event, callback) {
            console.log('[Stub] addEventListener:', event);

            // Для событий можно вызвать callback для проверки
            if (event === 'ready') {
                setTimeout(() => {
                    this.state = 'default';
                    callback();
                }, 1000); // Эмулируем задержку
            }
            if (event === 'viewableChange') {
                setTimeout(() => {
                    this.viewable = true;
                    callback(true);
                }, 2000); // Эмулируем изменение видимости
            }
        },

        // Метод getParameter
        getParameter: function (param) {
            console.log(`[Stub] getParameter(${param}) called`);
            return this.parameters[param] || null;
        },

        // Метод setParameter (для тестов)
        setParameter: function (param, value) {
            console.log(`[Stub] setParameter(${param}, ${value})`);
            this.parameters[param] = value;
        },
    };
}