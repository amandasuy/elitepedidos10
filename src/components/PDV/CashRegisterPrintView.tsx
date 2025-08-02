import React, { useState, useEffect } from 'react';
import { PDVCashRegister, PDVCashRegisterSummary, PDVCashRegisterEntry } from '../../types/pdv';
import { usePDVSettings } from '../../hooks/usePDVSettings';

interface CashRegisterPrintViewProps {
  register: PDVCashRegister;
  summary: PDVCashRegisterSummary;
  entries: PDVCashRegisterEntry[];
  onClose: () => void;
}

const CashRegisterPrintView: React.FC<CashRegisterPrintViewProps> = ({ 
  register, 
  summary, 
  entries, 
  onClose 
}) => {
  const { settings: pdvSettings } = usePDVSettings();
  const [printerSettings, setPrinterSettings] = useState({
    paper_width: '80mm',
    font_size: 14,
    auto_adjust_font: true,
    auto_adjust_paper: true
  });

  // Carregar configurações de impressora
  useEffect(() => {
    if (pdvSettings) {
      setPrinterSettings(prev => ({
        ...prev,
        paper_width: pdvSettings.printer_paper_width || '80mm',
        font_size: pdvSettings.printer_font_size || 14,
        auto_adjust_font: pdvSettings.printer_auto_adjust_font !== false,
        auto_adjust_paper: pdvSettings.printer_auto_adjust_paper !== false
      }));
    }
  }, [pdvSettings]);

  // Calcular tamanhos responsivos baseado no papel
  const getResponsiveSizes = () => {
    let baseFontSize = printerSettings.font_size;
    let width = printerSettings.paper_width === 'A4' ? '190mm' : (printerSettings.paper_width === '58mm' ? '54mm' : '76mm');
    let padding = printerSettings.paper_width === 'A4' ? '5mm' : (printerSettings.paper_width === '58mm' ? '1mm' : '2mm');

    if (printerSettings.auto_adjust_font) {
      if (printerSettings.paper_width === '58mm') baseFontSize = 10;
      else if (printerSettings.paper_width === '80mm') baseFontSize = 14;
      else if (printerSettings.paper_width === 'A4') baseFontSize = 16;
    }

    return {
      baseFontSize,
      titleSize: baseFontSize + 4,
      mediumSize: baseFontSize + 1,
      largeSize: baseFontSize + 2,
      smallSize: Math.max(8, baseFontSize - 4),
      width,
      padding
    };
  };

  const sizes = getResponsiveSizes();

  const formatPrice = (price: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  const formatDateTime = (dateString: string) => new Date(dateString).toLocaleString('pt-BR');

  const getPaymentMethodName = (method: string): string => {
    const methodNames: Record<string, string> = {
      'dinheiro': 'Dinheiro',
      'pix': 'PIX',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'voucher': 'Voucher',
      'misto': 'Pagamento Misto'
    };
    return methodNames[method] || method;
  };

  const handlePrint = () => {
    // Criar uma nova janela com conteúdo específico para impressão térmica
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Caixa #${register.id.slice(-8)}</title>
        <style>
          @page {
            size: ${printerSettings.paper_width} auto;
            margin: 0;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            color: black !important;
            background: white !important;
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: ${sizes.baseFontSize}px;
            line-height: 1.3;
            color: black;
            background: white;
            padding: ${sizes.padding};
            width: ${sizes.width};
          }
          
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: ${sizes.smallSize}px; font-weight: 600; }
          .title { font-size: ${sizes.titleSize}px; }
          .medium { font-size: ${sizes.mediumSize}px; font-weight: 600; }
          .large { font-size: ${sizes.largeSize}px; font-weight: 600; }
          .separator { 
            border-bottom: 1px dashed black; 
            margin: 5px 0; 
            padding-bottom: 5px; 
          }
          .flex-between { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            font-weight: 600;
          }
          .mb-1 { margin-bottom: 2px; }
          .mb-2 { margin-bottom: 5px; }
          .mb-3 { margin-bottom: 8px; }
          .mt-1 { margin-top: 2px; }
          .mt-2 { margin-top: 5px; }
          .ml-2 { margin-left: 8px; }
        </style>
      </head>
      <body>
        <!-- Cabeçalho -->
        <div class="center mb-3 separator">
          <div class="bold title" style="color: #000;">ELITE AÇAÍ</div>
          <div class="small">Relatório de Caixa</div>
          <div class="small">Rua Um, 1614-C</div>
          <div class="small">Residencial 1 - Cágado</div>
          <div class="small">Tel: (85) 98904-1010</div>
          <div class="small">CNPJ: 38.130.139/0001-22</div>
        </div>
        
        <!-- Dados do Caixa -->
        <div class="mb-3 separator">
          <div class="bold center mb-2 medium">=== RELATÓRIO DE CAIXA ===</div>
          <div class="small">Caixa: #${register.id.slice(-8)}</div>
          <div class="small" style="font-weight: 600;">Abertura: ${formatDateTime(register.opened_at)}</div>
          <div class="small" style="font-weight: 600;">Fechamento: ${register.closed_at ? formatDateTime(register.closed_at) : 'Em aberto'}</div>
          <div class="small" style="font-weight: 600;">Valor Abertura: ${formatPrice(register.opening_amount || 0)}</div>
          <div class="small" style="font-weight: 600;">Valor Fechamento: ${formatPrice(register.closing_amount || 0)}</div>
        </div>
        
        <!-- Resumo Financeiro -->
        <div class="mb-3 separator">
          <div class="bold mb-1 medium">RESUMO FINANCEIRO:</div>
          <div class="flex-between">
            <span class="small" style="font-weight: 600;">Vendas PDV:</span>
            <span class="small" style="font-weight: 600;">${formatPrice(summary.sales_total || 0)}</span>
          </div>
          <div class="flex-between">
            <span class="small" style="font-weight: 600;">Vendas Delivery:</span>
            <span class="small" style="font-weight: 600;">${formatPrice(summary.delivery_total || 0)}</span>
          </div>
          <div class="flex-between">
            <span class="small" style="font-weight: 600;">Outras Entradas:</span>
            <span class="small" style="font-weight: 600;">${formatPrice(summary.other_income_total || 0)}</span>
          </div>
          <div class="flex-between">
            <span class="small" style="font-weight: 600;">Saídas:</span>
            <span class="small" style="font-weight: 600;">${formatPrice(summary.total_expense || 0)}</span>
          </div>
          <div style="border-top: 1px solid black; padding-top: 3px; margin-top: 3px;">
            <div class="flex-between bold">
              <span class="large">Saldo Esperado:</span>
              <span class="large">${formatPrice(summary.expected_balance || 0)}</span>
            </div>
          </div>
          <div class="flex-between">
            <span class="small" style="font-weight: 600;">Diferença:</span>
            <span class="small" style="font-weight: 600;">${formatPrice(register.difference || 0)}</span>
          </div>
        </div>
        
        <!-- Movimentações -->
        <div class="mb-3 separator">
          <div class="bold mb-1 medium">MOVIMENTAÇÕES:</div>
          ${entries.map((entry, index) => `
            <div class="mb-2">
              <div class="small" style="font-weight: 600;">${formatDateTime(entry.created_at)}</div>
              <div class="flex-between">
                <span class="small">${entry.type === 'income' ? 'ENTRADA' : 'SAÍDA'}: ${entry.description}</span>
                <span class="small" style="font-weight: 600;">${entry.type === 'income' ? '+' : '-'}${formatPrice(entry.amount)}</span>
              </div>
              <div class="small">Forma: ${getPaymentMethodName(entry.payment_method)}</div>
            </div>
          `).join('')}
          ${entries.length === 0 ? '<div class="small center">Nenhuma movimentação registrada</div>' : ''}
        </div>
        
        <!-- Rodapé -->
        <div class="center small" style="border-top: 1px solid black; padding-top: 5px;">
          <div class="bold mb-2" style="font-size: ${sizes.baseFontSize}px;">Elite Açaí - Relatório de Caixa</div>
          <div>Impresso: ${new Date().toLocaleString('pt-BR')}</div>
          <div>Este não é um documento fiscal</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Aguardar carregar e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  // Auto-imprimir quando o componente for montado
  useEffect(() => {
    // Aguardar um pouco para garantir que o modal foi renderizado
    const timer = setTimeout(() => {
      handlePrint();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Modal Interface */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Controls */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Imprimindo Relatório de Caixa</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                  🖨️ Imprimir Novamente
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
              <div className="text-center mb-4">
                <p className="font-bold text-lg">ELITE AÇAÍ</p>
                <p className="text-sm">Relatório de Caixa</p>
                <p className="text-xs">Rua Um, 1614-C</p>
                <p className="text-xs">Residencial 1 - Cágado</p>
                <p className="text-xs">Tel: (85) 98904-1010</p>
                <p className="text-xs">CNPJ: 38.130.139/0001-22</p>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-bold text-center">=== RELATÓRIO DE CAIXA ===</p>
                <p className="text-xs">Caixa: #{register.id.slice(-8)}</p>
                <p className="text-xs">Abertura: {formatDateTime(register.opened_at)}</p>
                <p className="text-xs">Fechamento: {register.closed_at ? formatDateTime(register.closed_at) : 'Em aberto'}</p>
                <p className="text-xs">Valor Abertura: {formatPrice(register.opening_amount || 0)}</p>
                <p className="text-xs">Valor Fechamento: {formatPrice(register.closing_amount || 0)}</p>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-bold">RESUMO FINANCEIRO:</p>
                <p className="text-xs">Vendas PDV: {formatPrice(summary.sales_total || 0)}</p>
                <p className="text-xs">Vendas Delivery: {formatPrice(summary.delivery_total || 0)}</p>
                <p className="text-xs">Outras Entradas: {formatPrice(summary.other_income_total || 0)}</p>
                <p className="text-xs">Saídas: {formatPrice(summary.total_expense || 0)}</p>
                <p className="text-xs font-bold">Saldo Esperado: {formatPrice(summary.expected_balance || 0)}</p>
                <p className="text-xs">Diferença: {formatPrice(register.difference || 0)}</p>
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="mb-3">
                <p className="text-xs font-bold">MOVIMENTAÇÕES:</p>
                {entries.length === 0 ? (
                  <p className="text-xs text-center">Nenhuma movimentação registrada</p>
                ) : (
                  entries.map((entry, index) => (
                    <div key={index} className="text-xs mb-2">
                      <p>{formatDateTime(entry.created_at)}</p>
                      <p>{entry.type === 'income' ? 'ENTRADA' : 'SAÍDA'}: {entry.description}</p>
                      <p>Valor: {entry.type === 'income' ? '+' : '-'}{formatPrice(entry.amount)}</p>
                      <p>Forma: {getPaymentMethodName(entry.payment_method)}</p>
                      {index < entries.length - 1 && <p>---</p>}
                    </div>
                  ))
                )}
                <p className="text-xs">--------------------------</p>
              </div>
              
              <div className="text-center text-xs">
                <p className="font-bold">Elite Açaí - Relatório de Caixa</p>
                <p>Impresso: {new Date().toLocaleString('pt-BR')}</p>
                <p>Este não é um documento fiscal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CashRegisterPrintView;