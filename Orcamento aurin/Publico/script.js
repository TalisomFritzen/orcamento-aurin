// ==========================================
// SISTEMA DE ORÇAMENTOS - AURIN ARQUITETURA
// script.js - Versão com Backend/API
// ==========================================

// Variáveis globais
let configPercentages = {
    elec: 3,
    hydro: 3,
    pipe: 3,
    mach: 3,
    lod300: 3,
    lod400: 6
};

let budgetHistory = [];
let isCalculating = false;

// ==========================================
// FUNÇÕES DE CONFIGURAÇÃO E INICIALIZAÇÃO
// ==========================================

// Carrega configurações da API
async function loadConfigFromAPI() {
    try {
        const response = await fetch('/api/configurations');
        if (!response.ok) {
            throw new Error('Falha ao carregar configurações da API.');
        }
        const config = await response.json();
        configPercentages = config;
        console.log('Configurações carregadas da API:', configPercentages);
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        // Se der erro, usa os valores padrão
        configPercentages = {
            elec: 3, hydro: 3, pipe: 3, mach: 3, lod300: 3, lod400: 6
        };
        showToast('Erro ao carregar configurações. Usando valores padrão.', 'warning');
    }
}

// Carrega dados do formulário do localStorage (apenas para rascunho)
function loadFormFromLocalStorage() {
    const savedData = localStorage.getItem('aurinBudgetData');
    if (savedData) {
        try {
            const formData = JSON.parse(savedData);
            
            // Preenche campos de texto
            document.getElementById('client-name').value = formData.clientName || '';
            document.getElementById('client-email').value = formData.clientEmail || '';
            document.getElementById('client-phone').value = formData.clientPhone || '';
            document.getElementById('building-type').value = formData.buildingType || '';
            document.getElementById('square-meters').value = formData.squareMeters || '';
            document.getElementById('difficulty').value = formData.difficulty || '0';
            document.getElementById('discount').value = formData.discount || '';
            
            // Preenche checkboxes de disciplinas
            document.getElementById('arch-modeling').checked = formData.archModeling || false;
            document.getElementById('struct-modeling').checked = formData.structModeling || false;
            document.getElementById('elec-modeling').checked = formData.elecModeling || false;
            document.getElementById('hydro-modeling').checked = formData.hydroModeling || false;
            document.getElementById('pipe-modeling').checked = formData.pipeModeling || false;
            document.getElementById('mach-modeling').checked = formData.machModeling || false;
            
            // Preenche checkboxes de formatos
            document.getElementById('revit24').checked = formData.revit24 || false;
            document.getElementById('revit23').checked = formData.revit23 || false;
            document.getElementById('revit22').checked = formData.revit22 || false;
            document.getElementById('pdf').checked = formData.pdf || false;
            document.getElementById('dwg2d').checked = formData.dwg2d || false;
            document.getElementById('dwg3d').checked = formData.dwg3d || false;
            
            // Preenche radio buttons de LOD
            if (formData.selectedLod) {
                const lodRadio = document.querySelector(`input[name="lod-level"][value="${formData.selectedLod}"]`);
                if (lodRadio) {
                    lodRadio.checked = true;
                }
            }
            
            // Atualiza visualizações
            updateLodSelectionVisual();
            document.querySelectorAll('.selection-item input[type="checkbox"]').forEach(checkbox => {
                updateSelectionVisual(checkbox);
            });
            
            console.log('Dados do formulário carregados do localStorage');
        } catch (error) {
            console.error('Erro ao carregar dados do formulário:', error);
        }
    }
}

// Salva dados do formulário no localStorage (apenas para rascunho)
function saveFormToLocalStorage() {
    const formData = {
        clientName: document.getElementById('client-name').value,
        clientEmail: document.getElementById('client-email').value,
        clientPhone: document.getElementById('client-phone').value,
        buildingType: document.getElementById('building-type').value,
        squareMeters: document.getElementById('square-meters').value,
        difficulty: document.getElementById('difficulty').value,
        discount: document.getElementById('discount').value,
        archModeling: document.getElementById('arch-modeling').checked,
        structModeling: document.getElementById('struct-modeling').checked,
        elecModeling: document.getElementById('elec-modeling').checked,
        hydroModeling: document.getElementById('hydro-modeling').checked,
        pipeModeling: document.getElementById('pipe-modeling').checked,
        machModeling: document.getElementById('mach-modeling').checked,
        revit24: document.getElementById('revit24').checked,
        revit23: document.getElementById('revit23').checked,
        revit22: document.getElementById('revit22').checked,
        pdf: document.getElementById('pdf').checked,
        dwg2d: document.getElementById('dwg2d').checked,
        dwg3d: document.getElementById('dwg3d').checked,
        selectedLod: document.querySelector('input[name="lod-level"]:checked')?.value || 'lod200'
    };
    
    localStorage.setItem('aurinBudgetData', JSON.stringify(formData));
}

// ==========================================
// FUNÇÕES DE HISTÓRICO (API)
// ==========================================

// Carrega histórico de orçamentos da API
async function displayBudgetHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '<p>Carregando histórico...</p>';

    try {
        const response = await fetch('/api/budgets');
        if (!response.ok) {
            throw new Error('Falha ao carregar histórico da API.');
        }
        const history = await response.json();
        budgetHistory = history;

        historyList.innerHTML = '';

        if (budgetHistory.length === 0) {
            historyList.innerHTML = '<p>Nenhum orçamento salvo ainda.</p>';
            return;
        }

        budgetHistory.forEach((budget) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerHTML = `
                <div>
                    <h4>${budget.clientName}</h4>
                    <p>Valor: ${formatCurrency(budget.totalValue)}</p>
                    <p>Data: ${budget.quoteDate}</p>
                    <p>Área: ${budget.squareMeters} m²</p>
                    <p>Tipo: ${getDisplayBuildingType(budget.buildingType)}</p>
                </div>
                <div class="history-actions">
                    <button class="load-btn" data-id="${budget.id}" title="Carregar">➡️</button>
                    <button class="delete-btn" data-id="${budget.id}" title="Excluir">🗑️</button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });

        // Adiciona event listeners para os botões
        historyList.querySelectorAll('.load-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const budgetId = parseInt(e.target.dataset.id);
                await loadBudgetFromHistory(budgetId);
            });
        });

        historyList.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const budgetId = parseInt(e.target.dataset.id);
                await deleteBudgetFromHistory(budgetId);
            });
        });

    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        historyList.innerHTML = '<p>Erro ao carregar histórico. Tente recarregar a página.</p>';
        showToast('Erro ao carregar histórico. Verifique a conexão.', 'error');
    }
}

// Carrega um orçamento específico do histórico
async function loadBudgetFromHistory(budgetId) {
    const budgetToLoad = budgetHistory.find(b => b.id === budgetId);
    if (!budgetToLoad) {
        showToast('Orçamento não encontrado.', 'error');
        return;
    }

    try {
        // Preenche o formulário com os dados do histórico
        document.getElementById('client-name').value = budgetToLoad.clientName || '';
        document.getElementById('client-email').value = budgetToLoad.clientEmail || '';
        document.getElementById('client-phone').value = budgetToLoad.clientPhone || '';
        document.getElementById('building-type').value = budgetToLoad.buildingType || '';
        document.getElementById('square-meters').value = budgetToLoad.squareMeters || '';
        document.getElementById('difficulty').value = budgetToLoad.difficulty || '0';
        document.getElementById('discount').value = budgetToLoad.discount || '';
        
        // Checkboxes de disciplinas
        document.getElementById('arch-modeling').checked = budgetToLoad.archModeling || false;
        document.getElementById('struct-modeling').checked = budgetToLoad.structModeling || false;
        document.getElementById('elec-modeling').checked = budgetToLoad.elecModeling || false;
        document.getElementById('hydro-modeling').checked = budgetToLoad.hydroModeling || false;
        document.getElementById('pipe-modeling').checked = budgetToLoad.pipeModeling || false;
        document.getElementById('mach-modeling').checked = budgetToLoad.machModeling || false;
        
        // Checkboxes de formatos
        document.getElementById('revit24').checked = budgetToLoad.revit24 || false;
        document.getElementById('revit23').checked = budgetToLoad.revit23 || false;
        document.getElementById('revit22').checked = budgetToLoad.revit22 || false;
        document.getElementById('pdf').checked = budgetToLoad.pdf || false;
        document.getElementById('dwg2d').checked = budgetToLoad.dwg2d || false;
        document.getElementById('dwg3d').checked = budgetToLoad.dwg3d || false;

        // Radio buttons de LOD
        if (budgetToLoad.selectedLod) {
            const lodRadio = document.querySelector(`input[name="lod-level"][value="${budgetToLoad.selectedLod}"]`);
            if (lodRadio) {
                lodRadio.checked = true;
            }
        }

        // Atualiza visualizações
        updateLodSelectionVisual();
        document.querySelectorAll('.selection-item input[type="checkbox"]').forEach(checkbox => {
            updateSelectionVisual(checkbox);
        });

        // Recalcula o orçamento
        await calculateBudget(false);
        showToast('Orçamento carregado do histórico!', 'success');
        
        // Rola para o resultado
        document.getElementById('result-container').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Erro ao carregar orçamento:', error);
        showToast('Erro ao carregar orçamento do histórico.', 'error');
    }
}

// Salva o orçamento atual no histórico (API)
async function saveCurrentBudgetToHistory() {
    if (document.getElementById('result-container').style.display === 'none' || 
        !document.getElementById('total-value').textContent) {
        showToast('Não há um orçamento válido para salvar no histórico.', 'warning');
        return;
    }

    const currentFormData = {
        clientName: document.getElementById('client-name').value,
        clientEmail: document.getElementById('client-email').value,
        clientPhone: document.getElementById('client-phone').value,
        buildingType: document.getElementById('building-type').value,
        squareMeters: parseFloat(document.getElementById('square-meters').value),
        difficulty: parseInt(document.getElementById('difficulty').value),
        discount: parseFloat(document.getElementById('discount').value) || 0,
        archModeling: document.getElementById('arch-modeling').checked,
        structModeling: document.getElementById('struct-modeling').checked,
        elecModeling: document.getElementById('elec-modeling').checked,
        hydroModeling: document.getElementById('hydro-modeling').checked,
        pipeModeling: document.getElementById('pipe-modeling').checked,
        machModeling: document.getElementById('mach-modeling').checked,
        revit24: document.getElementById('revit24').checked,
        revit23: document.getElementById('revit23').checked,
        revit22: document.getElementById('revit22').checked,
        pdf: document.getElementById('pdf').checked,
        dwg2d: document.getElementById('dwg2d').checked,
        dwg3d: document.getElementById('dwg3d').checked,
        selectedLod: document.querySelector('input[name="lod-level"]:checked')?.value || 'lod200',
        baseValue: parseFloat(document.getElementById('base-value').textContent.replace('R$', '').replace('.', '').replace(',', '.')),
        difficultyValue: parseFloat(document.getElementById('difficulty-value').textContent.replace('R$', '').replace('.', '').replace(',', '.')),
        disciplineAdditionalValue: parseFloat(document.getElementById('discipline-additional-value').textContent.replace('R$', '').replace('.', '').replace(',', '.')),
        lodAdditionalValue: parseFloat(document.getElementById('lod-additional-value').textContent.replace('R$', '').replace('.', '').replace(',', '.')),
        discountValue: parseFloat(document.getElementById('discount-value').textContent.replace('R$', '').replace('-', '').replace('.', '').replace(',', '.')),
        totalValue: parseFloat(document.getElementById('total-value').textContent.replace('R$', '').replace('.', '').replace(',', '.')),
        modelingHours: parseInt(document.getElementById('modeling-hours').textContent),
        workingDays: parseInt(document.getElementById('working-days').textContent),
        quoteDate: document.getElementById('quote-date').textContent
    };

    try {
        const response = await fetch('/api/budgets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentFormData)
        });

        if (!response.ok) {
            throw new Error('Falha ao salvar orçamento na API.');
        }

        const result = await response.json();
        showToast(result.message || 'Orçamento salvo no histórico!', 'success');
        await displayBudgetHistory(); // Atualiza a lista
    } catch (error) {
        console.error('Erro ao salvar orçamento:', error);
        showToast('Erro ao salvar orçamento. Tente novamente.', 'error');
    }
}

// Deleta um orçamento do histórico
async function deleteBudgetFromHistory(budgetId) {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) {
        return;
    }

    try {
        const response = await fetch(`/api/budgets?id=${budgetId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Falha ao deletar orçamento da API.');
        }

        const result = await response.json();
        showToast(result.message || 'Orçamento excluído do histórico.', 'success');
        await displayBudgetHistory(); // Atualiza a lista
    } catch (error) {
        console.error('Erro ao deletar orçamento:', error);
        showToast('Erro ao deletar orçamento. Tente novamente.', 'error');
    }
}

// Limpa todo o histórico
async function clearBudgetHistory() {
    if (!confirm('Tem certeza que deseja limpar todo o histórico de orçamentos? Esta ação é irreversível!')) {
        return;
    }

    try {
        const response = await fetch('/api/budgets?id=clear-all', {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Falha ao limpar histórico na API.');
        }

        const result = await response.json();
        showToast(result.message || 'Histórico de orçamentos limpo!', 'success');
        await displayBudgetHistory(); // Atualiza a lista
    } catch (error) {
        console.error('Erro ao limpar histórico:', error);
        showToast('Erro ao limpar histórico. Tente novamente.', 'error');
    }
}

// ==========================================
// FUNÇÕES DE CÁLCULO DE ORÇAMENTO
// ==========================================

// Função principal de cálculo
async function calculateBudget(saveToLocalStorage = true) {
    if (isCalculating) return;
    
    isCalculating = true;
    const calculateBtn = document.getElementById('calculate-btn');
    const originalText = calculateBtn.textContent;
    calculateBtn.textContent = 'Calculando...';
    calculateBtn.disabled = true;

    try {
        // Validações
        if (!validateForm()) {
            return;
        }

        // Carrega configurações mais recentes
        await loadConfigFromAPI();

        // Coleta dados do formulário
        const formData = collectFormData();
        
        // Calcula valores
        const calculations = performCalculations(formData);
        
        // Exibe resultados
        displayResults(calculations, formData);
        
        // Salva rascunho no localStorage
        if (saveToLocalStorage) {
            saveFormToLocalStorage();
        }
        
        showToast('Orçamento calculado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao calcular orçamento:', error);
        showToast('Erro ao calcular orçamento. Tente novamente.', 'error');
    } finally {
        isCalculating = false;
        calculateBtn.textContent = originalText;
        calculateBtn.disabled = false;
    }
}

// Valida o formulário
function validateForm() {
    const requiredFields = [
        { id: 'client-name', name: 'Nome do Cliente' },
        { id: 'client-email', name: 'Email do Cliente' },
        { id: 'building-type', name: 'Tipo de Edificação' },
        { id: 'square-meters', name: 'Área em m²' }
    ];

    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element.value.trim()) {
            showToast(`Por favor, preencha o campo: ${field.name}`, 'warning');
            element.focus();
            return false;
        }
    }

    const squareMeters = parseFloat(document.getElementById('square-meters').value);
    if (isNaN(squareMeters) || squareMeters <= 0) {
        showToast('Por favor, insira uma área válida maior que zero.', 'warning');
        document.getElementById('square-meters').focus();
        return false;
    }

    const email = document.getElementById('client-email').value;
    if (!isValidEmail(email)) {
        showToast('Por favor, insira um email válido.', 'warning');
        document.getElementById('client-email').focus();
        return false;
    }

    return true;
}

// Valida email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Coleta dados do formulário
function collectFormData() {
    return {
        clientName: document.getElementById('client-name').value.trim(),
        clientEmail: document.getElementById('client-email').value.trim(),
        clientPhone: document.getElementById('client-phone').value.trim(),
        buildingType: document.getElementById('building-type').value,
        squareMeters: parseFloat(document.getElementById('square-meters').value),
        difficulty: parseInt(document.getElementById('difficulty').value),
        discount: parseFloat(document.getElementById('discount').value) || 0,
        disciplines: {
            arch: document.getElementById('arch-modeling').checked,
            struct: document.getElementById('struct-modeling').checked,
            elec: document.getElementById('elec-modeling').checked,
            hydro: document.getElementById('hydro-modeling').checked,
            pipe: document.getElementById('pipe-modeling').checked,
            mach: document.getElementById('mach-modeling').checked
        },
        formats: {
            revit24: document.getElementById('revit24').checked,
            revit23: document.getElementById('revit23').checked,
            revit22: document.getElementById('revit22').checked,
            pdf: document.getElementById('pdf').checked,
            dwg2d: document.getElementById('dwg2d').checked,
            dwg3d: document.getElementById('dwg3d').checked
        },
        selectedLod: document.querySelector('input[name="lod-level"]:checked')?.value || 'lod200'
    };
}

// Realiza os cálculos
function performCalculations(formData) {
    // Valor base por tipo de edificação
    const baseValues = {
        'residencial': 15,
        'comercial': 18,
        'industrial': 22,
        'institucional': 20
    };

    const baseValuePerM2 = baseValues[formData.buildingType] || 15;
    const baseValue = formData.squareMeters * baseValuePerM2;

    // Valor adicional por dificuldade
    const difficultyMultipliers = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5];
    const difficultyValue = baseValue * (difficultyMultipliers[formData.difficulty] - 1);

    // Valor adicional por disciplinas
    let disciplineAdditionalValue = 0;
    if (formData.disciplines.elec) disciplineAdditionalValue += baseValue * (configPercentages.elec / 100);
    if (formData.disciplines.hydro) disciplineAdditionalValue += baseValue * (configPercentages.hydro / 100);
    if (formData.disciplines.pipe) disciplineAdditionalValue += baseValue * (configPercentages.pipe / 100);
    if (formData.disciplines.mach) disciplineAdditionalValue += baseValue * (configPercentages.mach / 100);

    // Valor adicional por LOD
    let lodAdditionalValue = 0;
    if (formData.selectedLod === 'lod300') {
        lodAdditionalValue = baseValue * (configPercentages.lod300 / 100);
    } else if (formData.selectedLod === 'lod400') {
        lodAdditionalValue = baseValue * (configPercentages.lod400 / 100);
    }

    // Valor do desconto
    const discountValue = (baseValue + difficultyValue + disciplineAdditionalValue + lodAdditionalValue) * (formData.discount / 100);

    // Valor total
    const totalValue = baseValue + difficultyValue + disciplineAdditionalValue + lodAdditionalValue - discountValue;

    // Horas de modelagem (estimativa)
    const baseHours = formData.squareMeters * 0.5;
    const difficultyHours = baseHours * (formData.difficulty * 0.2);
    const disciplineHours = Object.values(formData.disciplines).filter(Boolean).length * (baseHours * 0.15);
    const lodHours = formData.selectedLod === 'lod300' ? baseHours * 0.3 : 
                     formData.selectedLod === 'lod400' ? baseHours * 0.6 : 0;
    
    const totalHours = Math.ceil(baseHours + difficultyHours + disciplineHours + lodHours);
    const workingDays = Math.ceil(totalHours / 8);

    return {
        baseValue,
        difficultyValue,
        disciplineAdditionalValue,
        lodAdditionalValue,
        discountValue,
        totalValue,
        modelingHours: totalHours,
        workingDays
    };
}

// Exibe os resultados
function displayResults(calculations, formData) {
    // Atualiza valores na tela
    document.getElementById('base-value').textContent = formatCurrency(calculations.baseValue);
    document.getElementById('difficulty-value').textContent = formatCurrency(calculations.difficultyValue);
    document.getElementById('discipline-additional-value').textContent = formatCurrency(calculations.disciplineAdditionalValue);
    document.getElementById('lod-additional-value').textContent = formatCurrency(calculations.lodAdditionalValue);
    document.getElementById('discount-value').textContent = '-' + formatCurrency(calculations.discountValue);
    document.getElementById('total-value').textContent = formatCurrency(calculations.totalValue);
    document.getElementById('modeling-hours').textContent = calculations.modelingHours;
    document.getElementById('working-days').textContent = calculations.workingDays;
    
    // Atualiza data do orçamento
    const currentDate = new Date().toLocaleDateString('pt-BR');
    document.getElementById('quote-date').textContent = currentDate;
    
    // Mostra o container de resultados
    document.getElementById('result-container').style.display = 'block';
    document.getElementById('result-container').scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// FUNÇÕES DE INTERFACE E UTILIDADES
// ==========================================

// Formata valor como moeda brasileira
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Converte tipo de edificação para exibição
function getDisplayBuildingType(type) {
    const types = {
        'residencial': 'Residencial',
        'comercial': 'Comercial',
        'industrial': 'Industrial',
        'institucional': 'Institucional'
    };
    return types[type] || type;
}

// Atualiza visual da seleção de LOD
function updateLodSelectionVisual() {
    document.querySelectorAll('.lod-option').forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio.checked) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Atualiza visual das seleções (checkboxes)
function updateSelectionVisual(checkbox) {
    const selectionItem = checkbox.closest('.selection-item');
    if (checkbox.checked) {
        selectionItem.classList.add('selected');
    } else {
        selectionItem.classList.remove('selected');
    }
}

// Exibe toast de notificação
function showToast(message, type = 'info') {
    // Remove toast anterior se existir
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Cria novo toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Adiciona ao body
    document.body.appendChild(toast);
    
    // Remove após 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Limpa o formulário
function clearForm() {
    if (confirm('Tem certeza que deseja limpar todos os campos do formulário?')) {
        document.getElementById('budget-form').reset();
        document.getElementById('result-container').style.display = 'none';
        
        // Remove seleções visuais
        document.querySelectorAll('.selection-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.lod-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Limpa localStorage
        localStorage.removeItem('aurinBudgetData');
        
        showToast('Formulário limpo!', 'info');
    }
}

// Gera PDF do orçamento (função placeholder)
function generatePDF() {
    if (document.getElementById('result-container').style.display === 'none') {
        showToast('Não há um orçamento calculado para gerar PDF.', 'warning');
        return;
    }
    
    // Aqui você pode implementar a geração de PDF
    // Por exemplo, usando jsPDF ou html2pdf
    showToast('Funcionalidade de PDF em desenvolvimento.', 'info');
}

// ==========================================
// INICIALIZAÇÃO E EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sistema de Orçamentos - Aurin Arquitetura iniciado');
    
    // Carrega configurações da API
    await loadConfigFromAPI();
    
    // Carrega dados salvos do formulário (rascunho)
    loadFormFromLocalStorage();
    
    // Carrega histórico de orçamentos
    await displayBudgetHistory();
    
    // Event listeners para o formulário
    const form = document.getElementById('budget-form');
    if (form) {
        // Salva rascunho quando campos mudam
        form.addEventListener('input', saveFormToLocalStorage);
        form.addEventListener('change', saveFormToLocalStorage);
    }
    
    // Event listener para botão de calcular
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => calculateBudget(true));
    }
    
    // Event listener para botão de salvar no histórico
    const saveHistoryBtn = document.getElementById('save-history-btn');
    if (saveHistoryBtn) {
        saveHistoryBtn.addEventListener('click', saveCurrentBudgetToHistory);
    }
    
    // Event listener para botão de limpar formulário
    const clearFormBtn = document.getElementById('clear-form-btn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearForm);
    }
    
    // Event listener para botão de gerar PDF
    const generatePdfBtn = document.getElementById('generate-pdf-btn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generatePDF);
    }
    
    // Event listener para botão de limpar histórico
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearBudgetHistory);
    }
    
    // Event listeners para seleções visuais
    document.querySelectorAll('.selection-item input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectionVisual(this);
        });
        // Atualiza visual inicial
        updateSelectionVisual(checkbox);
    });
    
    // Event listeners para LOD
    document.querySelectorAll('input[name="lod-level"]').forEach(radio => {
        radio.addEventListener('change', updateLodSelectionVisual);
    });
    updateLodSelectionVisual();
    
    console.log('Sistema inicializado com sucesso!');
});

// ==========================================
// FUNÇÕES EXPOSTAS GLOBALMENTE
// ==========================================

// Torna funções disponíveis globalmente para uso em HTML
window.calculateBudget = calculateBudget;
window.saveCurrentBudgetToHistory = saveCurrentBudgetToHistory;
window.clearForm = clearForm;
window.generatePDF = generatePDF;
window.clearBudgetHistory = clearBudgetHistory;