import React, { useState, useEffect } from 'react';
import { CalculatedPlan, HealthPlan } from '../types';

interface PlanCardProps {
  variants: CalculatedPlan[];
}

export const PlanCard: React.FC<PlanCardProps> = ({ variants }) => {
  const [showCopartInfo, setShowCopartInfo] = useState(false);
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  
  // Determine default selection:
  // If multiple variants, require user to select (index -1).
  // If single variant, select it automatically (index 0).
  const [selectedIndex, setSelectedIndex] = useState<number>(() => 
    variants.length > 1 ? -1 : 0
  );

  // Update state if variants prop changes
  useEffect(() => {
    if (variants.length > 1) {
      setSelectedIndex(-1);
    } else {
      setSelectedIndex(0);
    }
  }, [variants]);

  if (!variants || variants.length === 0) return null;

  const selectedPlan = selectedIndex >= 0 ? variants[selectedIndex] : null;
  
  // Static data comes from the first plan in the group (Name, Operator, Hospitals)
  // Or from selected plan if available
  const displayPlan = selectedPlan ? selectedPlan.plan : variants[0].plan;
  const basePlan = variants[0].plan;

  const formatMoney = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const renderCopartLabel = (plan: HealthPlan) => {
     switch(plan.coparticipationType) {
        case 'full': 
            return <span>Com Coparticipação</span>;
        case 'partial': 
            return (
                <span className="flex flex-row items-center gap-1 leading-tight">
                    <span className="whitespace-nowrap">Sem Copart.</span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase tracking-tight whitespace-nowrap pt-0.5">(Exceto Terapias)</span>
                </span>
            );
        case 'none': 
            // Special Tooltip for Fênix Select Plus
            if (plan.operator.includes('Fênix') && plan.name.includes('Select Plus')) {
              return (
                <div className="group relative inline-block">
                  <span className="border-b border-dotted border-gray-400 cursor-help">Sem Coparticipação</span>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block z-50 pointer-events-none">
                     <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-lg text-center relative">
                       Isenção total de custos adicionais em todos os procedimentos.
                       <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                     </div>
                  </div>
                </div>
              );
            }
            return <span>Sem Coparticipação</span>;
        default: 
            return <span>Padrão</span>;
     }
  };

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex flex-col h-full relative group">
        {/* Badge for Eva Saúde */}
        {basePlan.operator.includes('Eva') && (
            <div className="absolute top-0 left-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg z-20 shadow-sm">
                NOVIDADE
            </div>
        )}

        {/* Colored Header */}
        <div className={`${basePlan.logoColor} p-4 pt-5 flex justify-between items-start relative`}>
            <div className="flex-1 pr-2">
                <p className="text-xs font-bold text-white/80 uppercase tracking-wide mb-0.5">{basePlan.operator}</p>
                <h3 className="text-xl font-bold text-white leading-tight">
                    {basePlan.name}
                    {/* Specific Styling for Eva Prata */}
                    {basePlan.operator.includes('Eva') && basePlan.name.includes('Prata') && (
                        <span className="block text-xs font-normal opacity-90 mt-0.5 tracking-normal">(enfermaria)</span>
                    )}
                </h3>
            </div>
            
            {/* View Details Button - Moved to Header */}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowPlanDetails(true); }}
              className="flex-shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-50 px-3 py-1.5 rounded shadow-sm transition-colors uppercase tracking-wide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-500">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
              Ver Detalhes
            </button>
        </div>
        
        <div className="p-5 flex-1 flex flex-col">
          
          <div className="space-y-2 mb-4 flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase">Principais Hospitais:</p>
            <div className="flex flex-wrap gap-1">
              {basePlan.hospitals.map((h, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {h}
                </span>
              ))}
            </div>
          </div>
          
          {/* Copart Info Button - Enhanced */}
          <button 
            onClick={(e) => { e.stopPropagation(); setShowCopartInfo(true); }}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 py-2.5 rounded-lg transition-colors uppercase tracking-wide mt-2 mb-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500/80">
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 0 1-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.539 1.345 1.902 3.56 1.02 5.51-.686 1.52-2.255 2.447-3.232 3.12l-.052.036c-.906.62-2.055 1.407-2.055 2.88a.75.75 0 0 1-1.5 0c0-2.247 1.477-3.395 2.615-4.173l.052-.036c.888-.607 1.915-1.309 2.305-2.174.464-1.025.271-2.167-.537-2.874Z" clipRule="evenodd" />
              <path d="M12 18.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
            </svg>
            Entenda o que é coparticipação
          </button>
        </div>

        <div className="bg-gray-50 border-t border-gray-100">
           {/* Variant Selector */}
           {variants.length > 1 && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase">Escolha a modalidade:</p>
              </div>
              <div className="flex flex-col gap-2">
                {variants.map((v, idx) => {
                   const isSelected = idx === selectedIndex;
                   return (
                     <button
                        key={v.plan.id}
                        onClick={() => setSelectedIndex(idx)}
                        className={`group w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ease-in-out text-left relative overflow-hidden
                          ${isSelected 
                            ? 'bg-white border-blue-600 shadow-sm z-10' 
                            : 'bg-white border-gray-200 hover:border-blue-400 hover:bg-blue-50/30'
                          }`}
                     >
                        <div className="flex items-center gap-3 z-10 w-full overflow-hidden">
                          {/* Radio Circle UI */}
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors flex-shrink-0
                            ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-400'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                          </div>
                          
                          <span className={`font-bold text-sm transition-colors truncate ${isSelected ? 'text-blue-900' : 'text-gray-600'}`}>
                            {renderCopartLabel(v.plan)}
                          </span>
                        </div>
                        
                        {/* Selected Background Highlight */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-50 opacity-20 pointer-events-none"></div>
                        )}
                     </button>
                   );
                })}
              </div>
            </div>
           )}

           {/* Single Variant Label if only 1 exists */}
           {variants.length === 1 && (
             <div className="px-4 pt-4 flex justify-between items-center">
               <div className="text-xs font-bold py-1 px-3 rounded-full bg-gray-200 text-gray-600 inline-block">
                 {renderCopartLabel(variants[0].plan)}
               </div>
             </div>
           )}

          <div className="p-4 min-h-[100px]">
            {selectedPlan ? (
                <div className="animate-fadeIn">
                  <div className="flex justify-between items-end mb-4 pt-2 border-t border-gray-200/50">
                    <span className="text-sm text-gray-500 font-medium mb-1">Mensalidade Total</span>
                    <div className="text-right">
                        <span className="text-3xl font-bold text-blue-900 block leading-none tracking-tight">{formatMoney(selectedPlan.totalPrice)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded border border-gray-100 p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Detalhamento por vida</p>
                    <div className="space-y-2">
                      {selectedPlan.details.map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm text-gray-600 border-b border-gray-50 last:border-0 pb-1 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-1.5 rounded">{detail.count}x</span>
                            <span>{detail.ageRange} anos</span>
                          </div>
                          <span className="font-mono text-gray-800 font-medium">{formatMoney(detail.subtotal)}</span>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full py-4 text-gray-400 animate-pulse">
                    <span className="text-sm font-medium">Selecione uma modalidade</span>
                    <span className="text-xs">para ver o preço calculado</span>
                </div>
            )}
          </div>
        </div>
      </div>

      {/* Coparticipation Explanation Modal */}
      {showCopartInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={() => setShowCopartInfo(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowCopartInfo(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              Entenda a Coparticipação
            </h3>

            <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
              <p>
                👉 <span className="font-bold">Coparticipação</span> é quando o beneficiário paga um valor simbólico apenas quando usa o plano, como em consultas, exames ou terapias.
              </p>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="font-bold text-purple-900 mb-1">🔹 Sem Coparticipação (exceto em terapias)</p>
                <p>A cobrança acontece somente em terapias, como psicologia, fonoaudiologia e fisioterapia. Já as consultas, exames e demais atendimentos não têm custo extra — são totalmente cobertos pelo plano.</p>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                <p className="font-bold text-orange-900 mb-1">🔸 Com Coparticipação</p>
                <p>Nesse modelo, há cobrança toda vez que o plano é utilizado, seja em consultas, exames ou terapias. A mensalidade é mais baixa, mas o beneficiário participa mais nos custos quando usa o plano.</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="font-bold text-gray-900 mb-1">✨ Resumindo:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><span className="font-semibold">Sem Coparticipação:</span> paga apenas em terapias.</li>
                  <li><span className="font-semibold">Com Coparticipação:</span> paga em todos os serviços utilizados.</li>
                </ul>
              </div>
            </div>
            
            <button 
              onClick={() => setShowCopartInfo(false)}
              className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Plan Details Modal */}
      {showPlanDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowPlanDetails(false)}>
           <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className={`${basePlan.logoColor} p-6 rounded-t-2xl border-b border-white/10 flex justify-between items-center`}>
                 <div>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-wide">{displayPlan.operator}</p>
                    <h3 className="text-2xl font-bold text-white">{displayPlan.name}</h3>
                 </div>
                 <button onClick={() => setShowPlanDetails(false)} className="text-white/70 hover:text-white">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 
                 {/* Abrangência */}
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                         <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                       </svg>
                       Abrangência Geográfica
                    </h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {displayPlan.coverage}
                    </p>
                 </div>

                 {/* Carência */}
                 <div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                       </svg>
                       Carências (Estimadas)
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                       {displayPlan.gracePeriods.map((gp, i) => (
                          <li key={i} className="flex items-start gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></div>
                             <span>{gp}</span>
                          </li>
                       ))}
                    </ul>
                 </div>

                 {/* Tabela Copart */}
                 {displayPlan.coparticipationType !== 'none' && (
                   <div>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-blue-600">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                         </svg>
                         Coparticipação (Estimada)
                      </h4>
                      <div className="overflow-hidden rounded-lg border border-gray-200">
                         <table className="min-w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700 font-bold">
                               <tr>
                                  <th className="px-3 py-2">Serviço</th>
                                  <th className="px-3 py-2">Valor</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                               {displayPlan.copayFees.map((fee, i) => (
                                  <tr key={i} className="bg-white">
                                     <td className="px-3 py-2 text-gray-600">{fee.service}</td>
                                     <td className="px-3 py-2 font-medium text-gray-800">{fee.value}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 )}
                 
                 {displayPlan.coparticipationType === 'none' && (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-center">
                       <p className="text-green-800 font-bold">Este plano não possui coparticipação.</p>
                       <p className="text-green-600 text-sm">Uso livre sem taxas adicionais.</p>
                    </div>
                 )}
                 
                 <p className="text-[10px] text-gray-400 italic text-center mt-4">
                   * Os valores e condições podem sofrer alterações sem aviso prévio. Consulte o contrato final.
                 </p>
              </div>
              
              {/* Footer Action */}
              <div className="p-6 border-t border-gray-100">
                <button 
                  onClick={() => setShowPlanDetails(false)}
                  className="w-full bg-blue-900 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors shadow-lg shadow-blue-900/20"
                >
                  Fechar
                </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};