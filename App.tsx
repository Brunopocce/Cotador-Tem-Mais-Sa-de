import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_PLANS, AGE_RANGES } from './constants';
import { AgeRange, UserSelection, CalculatedPlan, QuoteCategory, HealthPlan } from './types';
import { AgeSelector } from './components/AgeSelector';
import { PlanCard } from './components/PlanCard';
import { WhatsAppButton } from './components/WhatsAppButton';

// Updated steps to separate age input from results
type AppStep = 'type-selection' | 'lives-selection' | 'age-input' | 'results';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('type-selection');
  const [quoteCategory, setQuoteCategory] = useState<QuoteCategory | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);

  const [userSelection, setUserSelection] = useState<UserSelection>(() => {
    const initial: UserSelection = {};
    AGE_RANGES.forEach(range => initial[range as string] = 0);
    return initial;
  });

  const [calculatedPlans, setCalculatedPlans] = useState<CalculatedPlan[]>([]);
  const [groupedPlans, setGroupedPlans] = useState<CalculatedPlan[][]>([]);

  // Reset selection when changing category
  const selectCategory = (category: QuoteCategory) => {
    setQuoteCategory(category);
    // Reset quantities
    const initial: UserSelection = {};
    AGE_RANGES.forEach(range => initial[range as string] = 0);
    setUserSelection(initial);
    setShowLimitAlert(false);
    setStep('age-input'); // Go to Age Input instead of direct calculator
  };

  const goBack = () => {
    if (step === 'results') {
      setStep('age-input');
    } else if (step === 'age-input') {
      if (quoteCategory === 'PF') {
        setStep('type-selection');
        setQuoteCategory(null);
      } else {
        setStep('lives-selection');
      }
    } else if (step === 'lives-selection') {
      setStep('type-selection');
    }
  };

  const switchToGroupPlan = () => {
    selectCategory('PME_2');
  };

  const totalLives = useMemo(() => 
    Object.values(userSelection).reduce((acc: number, curr: number) => acc + curr, 0)
  , [userSelection]);

  // Check if only minors (0-18) are selected
  const isSoloMinor = useMemo(() => {
    if (totalLives === 0) return false;
    const minorCount = userSelection[AgeRange.RANGE_0_18] || 0;
    return minorCount === totalLives;
  }, [userSelection, totalLives]);

  const handleIncrement = (range: string) => {
    // BLOCKING LOGIC FOR PME_1
    if (quoteCategory === 'PME_1' && totalLives >= 1) {
      setShowLimitAlert(true);
      // Remove alert after 3 seconds
      setTimeout(() => setShowLimitAlert(false), 3000);
      return;
    }

    setUserSelection(prev => ({ ...prev, [range]: prev[range] + 1 }));
    setShowLimitAlert(false);
  };

  const handleDecrement = (range: string) => {
    setUserSelection(prev => ({ ...prev, [range]: Math.max(0, prev[range] - 1) }));
    setShowLimitAlert(false);
  };

  const handleContinueToResults = () => {
    // Validation before proceeding
    if (totalLives === 0) return;

    if (quoteCategory === 'PME_1' && totalLives > 1) {
      setShowLimitAlert(true);
      return;
    }

    // PME Solo Minor Check
    if (quoteCategory?.startsWith('PME') && isSoloMinor) {
      // We trigger the visual alert in the UI, but we can also block here
      return;
    }

    setStep('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const activeAges = (Object.entries(userSelection) as [string, number][]).filter(([_, count]) => count > 0);
    
    // Filter plans based on category
    let availablePlans = MOCK_PLANS.filter(p => 
      quoteCategory && p.categories.includes(quoteCategory)
    );

    // RULE 3: PF - If only minors, exclude Fênix
    if (quoteCategory === 'PF' && isSoloMinor) {
      availablePlans = availablePlans.filter(p => !p.operator.toLowerCase().includes('fênix'));
    }

    if (activeAges.length === 0) {
      setCalculatedPlans([]);
      setGroupedPlans([]);
      return;
    }

    const results: CalculatedPlan[] = availablePlans.map(plan => {
      let total = 0;
      const details = [];

      for (const [range, count] of activeAges) {
        const price = plan.prices[range] || 0;
        const subtotal = price * count;
        total += subtotal;
        details.push({
          ageRange: range,
          count,
          unitPrice: price,
          subtotal
        });
      }

      return {
        plan,
        totalPrice: total,
        details
      };
    }).sort((a, b) => {
      // Helper function to determine sort weight
      const getPlanWeight = (plan: HealthPlan) => {
        const op = plan.operator.toLowerCase();
        const name = plan.name.toLowerCase();

        // 1. Amhemed Sequence: Ideal -> Amhe+ -> Plus
        if (op.includes('amhemed')) {
          if (name.includes('ideal')) return 10;
          if (name.includes('amhe+')) return 11;
          if (name.includes('plus')) return 12;
          return 19; // Other Amhemed
        }

        // 2. GNDI Sequence: Nosso Plano -> Smart 200 -> Smart 400
        if (op.includes('gndi') || op.includes('notredame')) {
          if (name.includes('nosso')) return 20;
          if (name.includes('notrelife')) return 21; // Seniors
          if (name.includes('200')) return 22;
          if (name.includes('400')) return 23;
          return 29; // Other GNDI
        }

        // 3. Eva Saúde
        if (op.includes('eva')) return 30;

        // 4. Fênix Medical
        if (op.includes('fênix') || op.includes('fenix')) return 40;

        // 5. Unimed Sorocaba
        if (op.includes('unimed')) return 50;

        // 6. Amil
        if (op.includes('amil')) return 60;

        return 100; // Fallback for others
      };

      const weightA = getPlanWeight(a.plan);
      const weightB = getPlanWeight(b.plan);

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      // Tie-breaker: Price (cheaper variant first, e.g. Full Copart vs No Copart)
      return a.totalPrice - b.totalPrice;
    });

    setCalculatedPlans(results);

    // Grouping Logic
    const groupedMap = new Map<string, CalculatedPlan[]>();
    
    results.forEach(cp => {
      // Unique key based on Operator, Name and Type (Enfermaria/Apartamento)
      // This groups "Com Copart" and "Sem Copart" variants together
      const key = `${cp.plan.operator}|${cp.plan.name}|${cp.plan.type}`;
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, []);
      }
      groupedMap.get(key)?.push(cp);
    });

    // Convert map to array of arrays
    setGroupedPlans(Array.from(groupedMap.values()));

  }, [userSelection, quoteCategory, isSoloMinor]);

  const getCategoryTitle = () => {
    switch (quoteCategory) {
      case 'PF': return 'Pessoa Física';
      case 'PME_1': return 'CNPJ / MEI (1 Vida)';
      case 'PME_2': return 'CNPJ / MEI (2-29 Vidas)';
      case 'PME_30': return 'CNPJ / MEI (+30 Vidas)';
      default: return '';
    }
  };

  const isPME = quoteCategory?.startsWith('PME');

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 border-b border-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Implementation */}
            <div className="flex flex-col items-end cursor-pointer group select-none" onClick={() => {
               setStep('type-selection');
               setQuoteCategory(null);
            }}>
                <div className="flex items-center">
                    <span className="text-4xl font-bold text-[#003366] tracking-tight">TEM</span>
                    <div className="mx-1 relative flex items-center justify-center h-10 w-10">
                        <div className="absolute inset-0 bg-[#003366] rounded opacity-10 transform rotate-45 transition-transform group-hover:rotate-90 duration-500"></div>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#003366] z-10">
                           <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M17,13h-3.5V16.5 c0,0.83-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5V13H7c-0.83,0-1.5-0.67-1.5-1.5S6.17,10,7,10h3.5V6.5C10.5,5.67,11.17,5,12,5 s1.5,0.67,1.5,1.5V10H17c0.83,0,1.5,0.67,1.5,1.5S17.83,13,17,13z"/>
                           <path fillOpacity="0.3" d="M12,8c-2.21,0-4,1.79-4,4s1.79,4,4,4s4-1.79,4-4S14.21,8,12,8z M12,14c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2 S13.1,14,12,14z"/>
                        </svg>
                    </div>
                    <span className="text-5xl font-cursive text-[#003366] -ml-1 mt-2">Saúde</span>
                </div>
                <div className="flex items-center gap-1 -mt-2 mr-1">
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Corretora Autorizada</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-blue-500">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-[#003366] font-semibold text-sm">Cotação Inteligente</p>
             <a href="#" className="text-gray-500 hover:text-[#003366] text-xs transition-colors">Sobre nós</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: TYPE SELECTION */}
        {step === 'type-selection' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
            <h1 className="text-3xl font-bold text-[#003366] mb-2 text-center">Vamos começar sua cotação</h1>
            <p className="text-gray-600 mb-10 text-center">Escolha o tipo de contratação ideal para você ou sua empresa.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
              <button 
                onClick={() => selectCategory('PF')}
                className="group relative bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-[#003366] hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Pessoa Física</h3>
                <p className="text-gray-500 text-sm">Planos individuais ou familiares (CPF).</p>
                <p className="mt-4 text-xs font-semibold text-[#003366] opacity-0 group-hover:opacity-100 transition-opacity">
                  Amhemed, GNDI, Fênix
                </p>
              </button>

              <button 
                onClick={() => setStep('lives-selection')}
                className="group relative bg-white p-8 rounded-2xl shadow-md border-2 border-transparent hover:border-[#003366] hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#003366] group-hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">CNPJ e MEI</h3>
                <p className="text-gray-500 text-sm">Planos empresariais com tabela reduzida.</p>
                <p className="mt-4 text-xs font-semibold text-[#003366] opacity-0 group-hover:opacity-100 transition-opacity">
                  Unimed, Amil, Eva, e mais...
                </p>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: LIVES SELECTION (CNPJ) */}
        {step === 'lives-selection' && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
             <button onClick={goBack} className="absolute top-32 left-4 md:left-20 flex items-center text-gray-500 hover:text-[#003366]">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Voltar
             </button>

             <h1 className="text-3xl font-bold text-[#003366] mb-2 text-center">Quantas vidas?</h1>
             <p className="text-gray-600 mb-10 text-center">Selecione o porte da sua empresa para ver as opções disponíveis.</p>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
                {/* 1 VIDA */}
                <button 
                  onClick={() => selectCategory('PME_1')}
                  className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:border-[#003366] hover:shadow-lg transition-all text-center"
                >
                  <div className="text-4xl font-bold text-[#003366] mb-2">1</div>
                  <div className="text-gray-600 font-medium">Vida</div>
                  <p className="text-xs text-gray-400 mt-2">Amhemed, GNDI, Unimed</p>
                </button>

                {/* 2-29 VIDAS */}
                <button 
                  onClick={() => selectCategory('PME_2')}
                  className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:border-[#003366] hover:shadow-lg transition-all text-center transform scale-105 ring-2 ring-blue-50"
                >
                  <div className="text-4xl font-bold text-[#003366] mb-2">2 a 29</div>
                  <div className="text-gray-600 font-medium">Vidas</div>
                  <p className="text-xs text-gray-400 mt-2">Todas as operadoras + Descontos</p>
                </button>

                {/* 30+ VIDAS */}
                <button 
                  onClick={() => selectCategory('PME_30')}
                  className="bg-white p-6 rounded-xl shadow border border-gray-100 hover:border-[#003366] hover:shadow-lg transition-all text-center"
                >
                  <div className="text-4xl font-bold text-[#003366] mb-2">30+</div>
                  <div className="text-gray-600 font-medium">Vidas</div>
                  <p className="text-xs text-gray-400 mt-2">Condições Especiais</p>
                </button>
             </div>
           </div>
        )}

        {/* VIEW 3: AGE INPUT */}
        {step === 'age-input' && (
          <div className="flex flex-col items-center justify-start min-h-[60vh] animate-fadeIn pt-4">
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                 <button onClick={goBack} className="flex items-center text-gray-500 hover:text-[#003366]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                  Voltar
                 </button>
                 <div className="text-right">
                   <p className="text-sm text-gray-500">Cotação para:</p>
                   <p className="font-bold text-[#003366]">{getCategoryTitle()}</p>
                 </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Quem será coberto?</h2>
              <p className="text-gray-500 mb-8 text-center">Adicione a quantidade de pessoas por faixa etária.</p>

              {/* Notifications Area for Age Input Step */}
              <div className="mb-6">
                 {/* PME 1 Life Limit Alert */}
                 {quoteCategory === 'PME_1' && showLimitAlert && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm mb-4 animate-shake">
                       <div className="flex items-start">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-600 mr-3 flex-shrink-0">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                         </svg>
                         <div>
                           <h3 className="font-bold text-red-900 text-sm">Limite de Vidas Atingido</h3>
                           <p className="text-red-800 text-sm mt-1">Esta modalidade permite apenas 1 vida (Titular).</p>
                           <button onClick={switchToGroupPlan} className="mt-2 text-blue-600 hover:underline text-sm font-semibold">Mudar para 2 a 29 vidas</button>
                         </div>
                       </div>
                    </div>
                 )}

                 {/* PME Solo Minor Alert */}
                 {isPME && isSoloMinor && totalLives > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm mb-4">
                       <h3 className="font-bold text-red-900 text-sm">Atenção</h3>
                       <p className="text-red-800 text-sm">Planos empresariais exigem um titular maior de 18 anos.</p>
                    </div>
                 )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                 <div className="space-y-3">
                    {AGE_RANGES.map((range) => (
                      <AgeSelector 
                        key={range}
                        range={range as string}
                        count={userSelection[range as string]}
                        onIncrement={handleIncrement}
                        onDecrement={handleDecrement}
                      />
                    ))}
                 </div>

                 <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-gray-600 font-medium">Total de vidas:</span>
                      <span className="text-3xl font-bold text-blue-600">{totalLives}</span>
                    </div>

                    <button 
                      onClick={handleContinueToResults}
                      disabled={totalLives === 0 || (isPME && isSoloMinor)}
                      className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform
                        ${totalLives > 0 && !(isPME && isSoloMinor)
                          ? 'bg-[#003366] text-white hover:bg-[#002244] hover:scale-[1.02]' 
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                    >
                      Avançar para Cotação
                    </button>
                    
                    {isPME && isSoloMinor && (
                      <p className="text-center text-red-500 text-xs mt-3">Adicione um adulto para prosseguir.</p>
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: RESULTS */}
        {step === 'results' && (
          <div className="animate-fadeIn">
            {/* Breadcrumb / Back */}
            <div className="mb-6 flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
               <div className="flex items-center">
                 <button onClick={goBack} className="mr-3 p-1 rounded-full hover:bg-blue-100 text-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                    </svg>
                 </button>
                 <span className="text-sm text-gray-500 mr-2">Resultados para:</span>
                 <span className="font-bold text-[#003366]">{getCategoryTitle()}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">{totalLives} Vidas</span>
               </div>
            </div>

            {/* NOTIFICATIONS / RULES */}
            <div className="mb-6 space-y-3">
               {/* RULE 3: PF - NO FÊNIX FOR SOLO MINORS */}
               {quoteCategory === 'PF' && isSoloMinor && (
                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r shadow-sm">
                   <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-orange-500 mr-3 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <div>
                       <h3 className="font-bold text-orange-900 text-sm">Cotação para Menor de Idade (PF)</h3>
                       <p className="text-orange-800 text-sm mt-1">
                         Para contratação individual de crianças (0 a 18 anos) sem um responsável no plano, a operadora <strong>Fênix Medical não está disponível</strong>. Exibindo opções da Amhemed e GNDI.
                       </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Planos Disponíveis</h2>
              <p className="text-gray-600 mt-1">Encontramos {groupedPlans.length} opções para o perfil selecionado.</p>
              
              {quoteCategory === 'PME_30' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                  <strong>Nota para grandes grupos:</strong> Os valores exibidos são baseados na tabela de 2 a 29 vidas para referência. Para empresas acima de 30 vidas, converse com nosso Consultor IA ou solicite uma negociação personalizada para isenção de carência e descontos adicionais.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
              {groupedPlans.map((group, idx) => (
                <PlanCard key={`${group[0].plan.id}-${idx}`} variants={group} />
              ))}
            </div>
          </div>
        )}
      </main>

      <WhatsAppButton />
    </div>
  );
};

export default App;