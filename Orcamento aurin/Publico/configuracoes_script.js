document.addEventListener('DOMContentLoaded', function() {
    // Referências aos inputs da página de configuração
    const configInputs = {
        elec: document.getElementById('config-elec'),
        hydro: document.getElementById('config-hydro'),
        pipe: document.getElementById('config-pipe'),
        mach: document.getElementById('config-mach'),
        lod300: document.getElementById('config-lod300'),
        lod400: document.getElementById('config-lod400')
    };

    // Função para carregar os percentuais do localStorage para os inputs
    function loadConfigPercentages() {
        const savedConfig = localStorage.getItem('aurinConfigPercentages');
        let currentPercentages = {
            elec: 3,
            hydro: 3,
            pipe: 3,
            mach: 3,
            lod300: 3,
            lod400: 6
        }; // Valores padrão

        if (savedConfig) {
            currentPercentages = { ...currentPercentages, ...JSON.parse(savedConfig) }; // Sobrescreve com os salvos
        }

        // Preenche os inputs com os valores carregados ou padrão
        for (const key in configInputs) {
            if (configInputs[key]) { // Garante que o elemento existe
                configInputs[key].value = currentPercentages[key];
            }
        }
    }

    // Função para salvar os percentuais dos inputs para o localStorage
    function saveConfigPercentages() {
        const newPercentages = {};
        for (const key in configInputs) {
            if (configInputs[key]) { // Garante que o elemento existe
                newPercentages[key] = parseFloat(configInputs[key].value) || 0;
            }
        }
        localStorage.setItem('aurinConfigPercentages', JSON.stringify(newPercentages));
        alert('Configurações salvas com sucesso!'); // Feedback simples
        // Em um projeto real, você usaria um toast ou notificação mais sofisticada
    }

    // Carrega os percentuais ao iniciar a página
    loadConfigPercentages();

    // Adiciona listener ao botão de salvar
    document.getElementById('save-config-btn').addEventListener('click', saveConfigPercentages);
});