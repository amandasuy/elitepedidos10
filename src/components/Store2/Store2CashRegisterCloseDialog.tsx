import React from 'react';
import { X, Printer, CheckCircle, MessageSquare, FileText, AlertTriangle } from 'lucide-react';
import { PDVCashRegister, PDVCashRegisterSummary } from '../../types/pdv';

interface Store2CashRegisterCloseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAll?: () => void;
  register: PDVCashRegister | null;
  summary: PDVCashRegisterSummary | null;
  onPrint: () => void;
}

const Store2CashRegisterCloseDialog: React.FC<Store2CashRegisterCloseDialogProps> = ({
  isOpen,
  onClose,
  onCloseAll,
  register,
  summary,
  onPrint
}) => {
  // Function to handle closing all dialogs
  const handleCloseAll = () => {
    // Call the regular onClose function
    onClose();
    
    // If onCloseAll is provided, call it to close all other dialogs
    if (onCloseAll) {
      onCloseAll();
    }
  };
  
  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const generateWhatsAppMessage = () => {
    // Check if register and summary are available
    if (!register || !summary) {
      console.error('Dados do caixa da Loja 2 não disponíveis para gerar mensagem', { register, summary });
      return encodeURIComponent('Erro ao gerar relatório da Loja 2: Dados do caixa não disponíveis. Por favor, tente novamente.');
    }

    try {
      let message = `*RELATÓRIO DE CAIXA - ELITE AÇAÍ LOJA 2*\n\n`;
    
      // Dados do caixa
      message += `*DADOS DO CAIXA:*\n`;
      message += `Abertura: ${formatDate(register.opened_at)}\n`;
      message += `Fechamento: ${formatDate(register.closed_at)}\n`;
      message += `Valor de abertura: ${formatPrice(register.opening_amount || 0)}\n`;
      message += `Valor de fechamento: ${formatPrice(register.closing_amount || 0)}\n\n`;
    
      // Resumo financeiro
      message += `*RESUMO FINANCEIRO:*\n`;
      message += `Vendas PDV: ${formatPrice(summary?.sales_total || 0)}\n`;
      message += `Outras entradas: ${formatPrice(summary?.other_income_total || 0)}\n`;
      message += `Saídas: ${formatPrice(summary?.total_expense || 0)}\n`;
      message += `Saldo esperado: ${formatPrice(summary?.expected_balance || 0)}\n`;
      
      const difference = (register.closing_amount || 0) - (summary?.expected_balance || 0);
      message += `Diferença: ${formatPrice(difference)}`;
      if (difference > 0) {
        message += ` (sobra)`;
      } else if (difference < 0) {
        message += ` (falta)`;
      }
      message += `\n\n`;
    
      message += `*Relatório gerado em:* ${new Date().toLocaleString('pt-BR')}\n`;
      message += `*Loja 2 - Rua Dois, 2130-A*`;
    
      return encodeURIComponent(message);
    } catch (error) {
      console.error('Erro ao gerar mensagem de WhatsApp da Loja 2:', error);
      return encodeURIComponent('Erro ao gerar relatório da Loja 2. Por favor, tente novamente.');
    }
  };

  const handleSendWhatsApp = () => {
    if (!register || !summary) {
      alert('Erro: Dados do caixa da Loja 2 não disponíveis. Por favor, tente novamente.');
      console.error('Erro ao enviar WhatsApp da Loja 2: Dados do caixa não disponíveis', { register, summary });
      return;
    }

    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/5585989041010?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              Caixa Loja 2 Fechado!
            </h2>
            <button 
              onClick={handleCloseAll}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600">
            O caixa da Loja 2 foi fechado com um valor de {register?.closing_amount ? formatPrice(register.closing_amount) : "N/A"}
          </p>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-blue-800 mb-2">Opções de Relatório - Loja 2</h3>
                <p className="text-blue-700 mb-3">
                  O que você gostaria de fazer com o relatório deste caixa da Loja 2?
                </p>
                <p className="text-sm text-blue-600 bg-white/70 p-3 rounded-lg border border-blue-100">
                  O relatório mostra todas as movimentações, vendas e resumo financeiro do caixa da Loja 2.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700 mb-2">Escolha uma opção:</h4>
            
            <button
              onClick={onPrint}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
              autoFocus
            >
              <div className="bg-white/20 rounded-full p-2">
                <Printer size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">Imprimir Movimentações</div>
                <div className="text-blue-100 text-sm">Relatório térmico da Loja 2</div>
              </div>
            </button>
            
            <button 
              onClick={handleSendWhatsApp}
              disabled={!register || !summary}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-md"
            >
              <div className="bg-white/20 rounded-full p-2">
                <MessageSquare size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">Enviar por WhatsApp</div>
                <div className="text-green-100 text-sm">Compartilhar relatório da Loja 2</div>
              </div>
            </button>
            
            {(!register || !summary) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-700">
                  Alguns dados do caixa da Loja 2 não estão disponíveis para envio por WhatsApp.
                </p>
              </div>
            )}
            
            <button
              onClick={handleCloseAll}
              className="w-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg mt-4"
            >
              🚪 Fechar e Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store2CashRegisterCloseDialog;