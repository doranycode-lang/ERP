import { Produto } from "../types";

// Helper to generate EAN13 check digit
function generateEAN13(codeNumber: number): string {
  const base = `560${String(codeNumber).padStart(9, "0")}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${base}${checkDigit}`;
}

// Generate exact, high-detail catalogue of 999 items for DR. ELIAS MED LAB TECH
export const catalogoEletromedicina999: Produto[] = (() => {
  const items: Produto[] = [];

  // =========================================================================
  // CATEGORIA 1: SERVIÇOS TÉCNICOS [SVC001 - SVC050] (50 Itens)
  // =========================================================================
  const servicosTecnicosData: [string, string, number, string][] = [
    ["SVC001", "Manutenção Preventiva Microscópio Biológico", 75000, "serv"],
    ["SVC002", "Manutenção Corretiva Microscópio Biológico", 85000, "serv"],
    ["SVC003", "Calibração de Balança Analítica 0.1mg", 60000, "serv"],
    ["SVC004", "Calibração de Balança Semi-Analítica 0.01g", 45000, "serv"],
    ["SVC005", "Reparação de Autoclave Vertical 18L", 120000, "serv"],
    ["SVC006", "Reparação de Autoclave Horizontal 50L", 250000, "serv"],
    ["SVC007", "Manutenção de Centrífuga de Bancada", 90000, "serv"],
    ["SVC008", "Manutenção de Centrífuga Refrigerada", 180000, "serv"],
    ["SVC009", "Reparação de Incubadora CO2", 220000, "serv"],
    ["SVC010", "Reparação de Estufa Bacteriológica", 110000, "serv"],
    ["SVC011", "Manutenção de Banho Maria", 65000, "serv"],
    ["SVC012", "Reparação de Agitador Magnético", 40000, "serv"],
    ["SVC013", "Reparação de Vortex", 35000, "serv"],
    ["SVC014", "Manutenção de Espectrofotômetro UV-VIS", 280000, "serv"],
    ["SVC015", "Calibração de pHmetro de Bancada", 50000, "serv"],
    ["SVC016", "Reparação de Bomba de Infusão", 150000, "serv"],
    ["SVC017", "Manutenção de Monitor Multiparamétrico", 200000, "serv"],
    ["SVC018", "Reparação de Eletrocardiógrafo 12 canais", 190000, "serv"],
    ["SVC019", "Manutenção de Desfibrilador", 350000, "serv"],
    ["SVC020", "Reparação de Aparelho de Anestesia", 450000, "serv"],
    ["SVC021", "Manutenção de Ventilador Pulmonar", 600000, "serv"],
    ["SVC022", "Calibração de Pipeta 10-100ul", 20000, "serv"],
    ["SVC023", "Calibração de Pipeta 100-1000ul", 20000, "serv"],
    ["SVC024", "Manutenção de Lavadora de Microplacas", 160000, "serv"],
    ["SVC025", "Manutenção de Leitora de Microplacas", 200000, "serv"],
    ["SVC026", "Reparação de Homogeneizador", 110000, "serv"],
    ["SVC027", "Manutenção de Destilador de Água", 130000, "serv"],
    ["SVC028", "Manutenção de Capela de Exaustão", 170000, "serv"],
    ["SVC029", "Manutenção de Freezer -80°C", 400000, "serv"],
    ["SVC030", "Manutenção de Refrigerador Laboratorial", 95000, "serv"],
    ["SVC031", "Instalação de Equipamento Laboratorial", 40000, "serv"],
    ["SVC032", "Treinamento de Operação 2h", 50000, "serv"],
    ["SVC033", "Serviço de Diagnóstico + Orçamento", 15000, "serv"],
    ["SVC034", "Relatório Técnico + Laudo", 30000, "serv"],
    ["SVC035", "Visita Técnica em Luanda", 25000, "serv"],
    ["SVC036", "Deslocação fora de Luanda - por KM", 500, "km"],
    ["SVC037", "Configuração de Software de Equipamento", 55000, "serv"],
    ["SVC038", "Atualização de Firmware", 35000, "serv"],
    ["SVC039", "Validação de Equipamento IQ/OQ", 120000, "serv"],
    ["SVC040", "Limpeza e Descontaminação de Equipamento", 25000, "serv"],
    ["SVC041", "Manutenção de Bomba de Seringa", 130000, "serv"],
    ["SVC042", "Manutenção de Bomba Peristáltica", 90000, "serv"],
    ["SVC043", "Reparação de Cuba Ultrassônica", 85000, "serv"],
    ["SVC044", "Manutenção de Fluxo Laminar", 140000, "serv"],
    ["SVC045", "Certificação de Fluxo Laminar", 80000, "serv"],
    ["SVC046", "Reparação de Microscópio Cirúrgico", 320000, "serv"],
    ["SVC047", "Manutenção de Equipamento Odontológico", 180000, "serv"],
    ["SVC048", "Reparação de Raio X Portátil", 500000, "serv"],
    ["SVC049", "Manutenção de Equipamento de Fisioterapia", 70000, "serv"],
    ["SVC050", "Suporte Técnico Remoto 1h", 15000, "hr"],
  ];

  servicosTecnicosData.forEach(([cod, desc, preco, un], idx) => {
    items.push({
      id: idx + 1,
      codigo: cod,
      codigoBarras: generateEAN13(idx + 1),
      nome: desc,
      descricao: `Serviço técnico especializado - Dr. Elias Med Lab Tech`,
      categoria: "Serviços Técnicos",
      preco: preco,
      precoCusto: Math.round(preco * 0.3),
      stock: 999,
      stockMinimo: 0,
      unidadeMedida: un,
      ivaIsento: false,
      ativo: true,
      localizacao: "Oficina Técnica Central",
    });
  });

  // =========================================================================
  // CATEGORIA 2: PEÇAS MICROSCÓPIO [PEC051 - PEC150] (100 Itens)
  // =========================================================================
  const pecasMicroscopioBase: [string, string, number][] = [
    ["PEC051", "Lâmpada Halogénea 6V 20W", 18000],
    ["PEC052", "Lâmpada LED para Microscópio", 25000],
    ["PEC053", "Fusível do Microscópio 250V 2A", 2500],
    ["PEC054", "Parafuso Macrométrico Completo", 35000],
    ["PEC055", "Parafuso Micrométrico Completo", 30000],
    ["PEC056", "Platina Mecânica XY", 55000],
    ["PEC057", "Objetiva 4X Acromática", 40000],
    ["PEC058", "Objetiva 10X Acromática", 45000],
    ["PEC059", "Objetiva 40X Retrátil Acromática", 75000],
    ["PEC060", "Objetiva 100X Imersão a Óleo", 95000],
    ["PEC061", "Ocular WF10X Par", 20000],
    ["PEC062", "Condensador Abbe N.A 1.25", 38000],
    ["PEC063", "Fonte de Alimentação LED 5V/12V", 28000],
    ["PEC064", "Cabo de Energia Microscópio Tripolar", 5000],
    ["PEC065", "Revolver Porta Objetivas 4 furos", 32000],
    ["PEC066", "Diafragma de Íris para Condensador", 15000],
    ["PEC067", "Filtro Azul para Microscópio 32mm", 8000],
    ["PEC068", "Filtro Verde para Microscópio 32mm", 8000],
    ["PEC069", "Kit de Limpeza Óptica para Microscópio", 12000],
    ["PEC070", "Óleo de Imersão Tipo A 100ml", 9000],
  ];

  const marcasMicroscopio = ["Olympus", "Leica", "Motic", "Zeiss", "Nikon", "Optika"];
  const pecasNomesMicro = [
    "Prisma Divisor Óptico Trinocular", "Cabeçote Binocular Inclinado 45°", "Câmera Digital CMOS 5MP para Microscópio",
    "Adaptador C-Mount 0.5X", "Adaptador C-Mount 1X", "Lente de Campo Coletora", "Suporte do Condensador com Cremalheira",
    "Potenciômetro Regulador de Luminosidade", "Placa Controladora de Iluminação LED", "Espelho Refletor Plano/Côncavo",
    "Objetiva Planacromática 20X", "Objetiva Planacromática 60X Retrátil", "Objetiva Planacromática 100X Óleo",
    "Ocular Micrométrica WF10X com Retículo", "Ocular WF16X Par", "Ocular WF20X Par", "Lâmina Padrão de Calibração Micrométrica",
    "Pinça de Fixação de Lâmina na Platina", "Presilha Dupla para Platina Mecânica", "Anel de Ajuste de Dioptria",
    "Filtro Polarizador 32mm", "Filtro Analisador de Polarização", "Filtro Amarelo de Contraste", "Iluminador Kohler Completo",
    "Soquete de Cerâmica para Lâmpada G4", "Transformador 220V/6V para Halogéneo", "Módulo de Fluorescência LED Azul/Verde",
    "Lâmpada de Mercúrio 100W HBO", "Fonte de Alimentação para Fluorescência", "Tubo Fotográfico Vertical Trinocular",
    "Condensador Campo Escuro N.A 1.36", "Condensador de Contraste de Fase", "Jogo de Anéis de Fase 10X/40X/100X",
    "Objetiva Contraste de Fase 40X", "Objetiva Contraste de Fase 100X", "Lente Telescópica de Centralização de Fase",
    "Capa de Proteção Anti-Poeira Vinil", "Engrenagem Helicoidal do Macrométrico", "Eixo Sem-Fim do Micrométrico",
    "Placa Base em Alumínio Anodizado", "Guia Linear da Platina XY", "Sensor Óptico de Posição de Platina",
    "Módulo de Autofoco Motorizado", "Fonte Chaveada Externa 12V 3A Bivolt", "Cabo USB 3.0 Blindado para Câmera",
    "Suporte Ergonômico Inclinável", "Borracha Protetora de Ocular Par", "Graxa Sintética Óptica para Guias",
    "Solução Limpa-Lentes Ópticas 50ml", "Papel Especial para Limpeza de Lentes 100fls"
  ];

  for (let i = 51; i <= 150; i++) {
    const cod = `PEC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 70) {
      const b = pecasMicroscopioBase[i - 51];
      desc = b[1];
      preco = b[2];
    } else {
      const idxPeca = (i - 71) % pecasNomesMicro.length;
      const marca = marcasMicroscopio[(i - 71) % marcasMicroscopio.length];
      desc = `${pecasNomesMicro[idxPeca]} (${marca})`;
      preco = Math.round((12000 + ((i * 1373) % 98000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Componente/Peça original para Microscopia - Catálogo Eletromedicina Dr. Elias`,
      categoria: "Peças Microscópio",
      preco: preco,
      precoCusto: Math.round(preco * 0.55),
      stock: 5 + (i % 25),
      stockMinimo: 3,
      unidadeMedida: "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém B - Prateleira M${(i % 5) + 1}`,
      loteAtual: `LT-MIC-${i}`,
      dataValidade: "31/12/2028",
    });
  }

  // =========================================================================
  // CATEGORIA 3: AUTOCLAVE E ESTERILIZAÇÃO [PEC151 - PEC200] (50 Itens)
  // =========================================================================
  const autoclaveBase: [string, string, number][] = [
    ["PEC151", "Resistência Autoclave Tubular 2000W 220V", 22000],
    ["PEC152", "Válvula de Segurança Autoclave 2.5 Bar", 18000],
    ["PEC153", "Junta da Porta Autoclave Silicone 18L", 15000],
    ["PEC154", "Termostato de Segurança para Autoclave", 12000],
    ["PEC155", "Manômetro Analógico para Autoclave 0-4 Bar", 10000],
  ];

  const autoclaveNomes = [
    "Válvula Solenóide 2/2 Vias 220V Latão", "Sensor de Pressão Transdutor 0-5V", "Sensor de Temperatura PT100 Aço Inox",
    "Placa Principal Microcontrolada para Autoclave", "Painel Membrana Digital Teclado", "Bomba de Vácuo de Pistão para Autoclave",
    "Filtro Bacteriológico de Ar 0.22um", "Junta da Porta Silicone Alta Temperatura 24L", "Junta da Porta Silicone Perfil Quadrado 50L",
    "Resistência de Imersão Flangeada 3000W", "Resistência de Fita Aquecedora da Câmara", "Trava de Segurança Eletromecânica da Porta",
    "Microinterruptor Fim de Curso de Porta", "Reservatório de Água Limpa em Polipropileno", "Sensor de Nível Condutivo de Água",
    "Válvula de Retenção Inox 1/4", "Manômetro Digital com Display LED", "Válvula de Despressurização Manual",
    "Bandeja em Aço Inox 304 Perfurada Pequena", "Bandeja em Aço Inox 304 Perfurada Grande", "Suporte Porta-Bandejas em Inox",
    "Puxador Ergonômico de Tampa com Trava", "Gaxeta de Vedação em EPDM", "Conexão Engate Rápido em Latão Niquelado",
    "Relé Térmico de Proteção de Sobrecarga", "Fusível Cerâmico de Ação Retardada 16A", "Mangueira de Teflon com Malha de Aço 1/2",
    "Silenciador de Descarga de Vapor", "Válvula Solenóide de Purga de Ar", "Módulo de Impressão Térmica para Autoclave",
    "Papel Termossensível para Registro de Ciclo", "Seladora Térmica de Grau Cirúrgico 30cm", "Resistência de Seladora 30cm com Fita Teflon",
    "Fita de Teflon Protetora para Seladora 10m", "Lâmina de Corte Bisturi para Seladora", "Termostato Bimetálico 134°C",
    "Pressostato Regulável de Controle 1-3 Bar", "Câmara de Esterilização Inox 316L 18L", "Condensador de Vapor Tubular",
    "Kit Reparo Válvula Solenóide (Membrana+Mola)", "Chave Geral Bipolar 16A com Sinalizador", "Sinaleiro LED Indicador de Ciclo",
    "Bomba Dosadora Peristáltica de Água", "Cabo de Sensor Blindado Alta Temperatura", "Isolamento Térmico em Lã de Rocha para Câmara"
  ];

  for (let i = 151; i <= 200; i++) {
    const cod = `PEC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 155) {
      const b = autoclaveBase[i - 151];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 156) % autoclaveNomes.length;
      desc = autoclaveNomes[idx];
      preco = Math.round((14000 + ((i * 1239) % 65000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Peça de reposição para Autoclaves e Esterilizadores hospitalares`,
      categoria: "Autoclave e Esterilização",
      preco: preco,
      precoCusto: Math.round(preco * 0.52),
      stock: 4 + (i % 15),
      stockMinimo: 2,
      unidadeMedida: "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém A - Prateleira AUT-${(i % 4) + 1}`,
      loteAtual: `LT-AUT-${i}`,
      dataValidade: "30/06/2029",
    });
  }

  // =========================================================================
  // CATEGORIA 4: CENTRÍFUGA E AGITAÇÃO [PEC201 - PEC250] (50 Itens)
  // =========================================================================
  const centrifugaBase: [string, string, number][] = [
    ["PEC201", "Rotor para Centrífuga 24 tubos 15ml Ângulo Fixo", 65000],
    ["PEC202", "Tubo para Centrífuga 15ml Polipropileno pct 50un", 12000],
    ["PEC203", "Motor de Indução para Agitador Orbital", 48000],
  ];

  const centrifugaNomes = [
    "Rotor Basculante 4 x 100ml para Centrífuga", "Caçapa em Alumínio para Tubo 15ml (Jogo 4un)", "Caçapa em Alumínio para Tubo 50ml (Jogo 4un)",
    "Adaptador Redutor de Caçapa 15ml para 5ml", "Rotor para Microtubos 24 x 1.5/2.0ml", "Rotor para Microhematócrito 24 Capilares",
    "Régua Leitora de Microhematócrito em Acrílico", "Tampa Protetora com Trava Eletromagnética", "Sensor de Desbalanceamento Mecânico",
    "Sensor Óptico de Velocidade / Tacômetro", "Amortecedor de Vibração em Borracha Nitrílica", "Jogo de Escovas de Carvão para Motor Universal",
    "Porta-Escovas em Baquelite para Motor", "Placa Controladora de Rotação PWM e Display", "Inversor de Frequência para Motor Brushless",
    "Motor Brushless Trifásico 5000 RPM", "Chave Geral Liga/Desliga com Trava", "Mola a Gás Amortecedora de Tampa",
    "Borracha de Vedação da Câmara de Centrifugação", "Plataforma Emborrachada Antiderrapante para Agitador", "Garra para Frascos Erlenmeyer 250ml em Inox",
    "Garra para Frascos Erlenmeyer 500ml em Inox", "Placa de Aquecimento para Agitador Magnético Cerâmica", "Motor de Passo para Agitador Magnético",
    "Barra Magnética Revestida em PTFE (Peixinho) 25mm", "Barra Magnética Revestida em PTFE (Peixinho) 35mm", "Recuperador de Barra Magnética Imantado",
    "Cúpula de Borracha para Agitador Vortex", "Plataforma Plana para Microplacas Vortex", "Motor de Alto Torque para Agitador Vortex",
    "Mola de Suspensão com Amortecedor Vortex", "Chave Seletora de Modo Contínuo / Pulso Vortex", "Rolamento Blindado de Alta Rotação 608ZZ",
    "Rolamento de Precisão SKF 6201-2Z", "Eixo Rotor Central Retificado em Inox", "Porca de Fixação do Rotor em Alumínio",
    "Display Digital LCD 16x2 com Backlight Azul", "Encoder Rotativo de Ajuste de RPM e Tempo", "Buzzer Sonoro Alarme de Fim de Ciclo 12V",
    "Fonte de Alimentação DC 24V para Centrifuga", "Compressor Hermético para Centrífuga Refrigerada 1/3 HP", "Gás Refrigerante R134a Carga 300g",
    "Sensor de Temperatura NTC para Cuba Refrigerada", "Câmara de Centrifugação em Inox 304", "Dreno de Condensado com Válvula",
    "Fusível de Vidro 250V 10A Ação Rápida", "Kit Pés de Ventosa de Fixação de Bancada (4un)"
  ];

  for (let i = 201; i <= 250; i++) {
    const cod = `PEC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 203) {
      const b = centrifugaBase[i - 201];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 204) % centrifugaNomes.length;
      desc = centrifugaNomes[idx];
      preco = Math.round((9500 + ((i * 1487) % 75000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Peça e acessório para centrífugas, vórtex e agitadores laboratoriais`,
      categoria: "Centrífuga e Agitação",
      preco: preco,
      precoCusto: Math.round(preco * 0.5),
      stock: 6 + (i % 20),
      stockMinimo: 3,
      unidadeMedida: desc.includes("pct") ? "pct" : "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém B - Prateleira CEN-${(i % 3) + 1}`,
      loteAtual: `LT-CEN-${i}`,
      dataValidade: "31/12/2028",
    });
  }

  // =========================================================================
  // CATEGORIA 5: EQUIP. HOSPITALAR [PEC251 - PEC350] (100 Itens)
  // =========================================================================
  const hospBase: [string, string, number][] = [
    ["PEC251", "Bateria Recarregável para Monitor 12V 7Ah Selada", 28000],
    ["PEC252", "Sensor SPO2 Adulto Reutilizável Clip de Dedo", 35000],
    ["PEC253", "Manguito PNI Adulto 25-35cm com Manguito 1 Via", 18000],
    ["PEC254", "Cabo ECG 5 vias Tipo Snap / Clip", 22000],
    ["PEC255", "Papel ECG Termossensível 210mm x 30m Rolo", 8000],
  ];

  const hospNomes = [
    "Sensor SPO2 Pediátrico Soft Silicone", "Sensor SPO2 Neonatal Tipo Y com Fita Envoltória", "Cabo Extensor para Sensor SPO2 Nellcor / Mindray",
    "Manguito PNI Pediátrico 18-26cm", "Manguito PNI Neonatal 10-15cm", "Manguito PNI Adulto Grande / Obeso 33-47cm",
    "Tubo Extensor PNI com Conectores Engate Rápido", "Cabo ECG 3 vias Terminal Garra", "Cabo ECG 10 vias para Eletrocardiógrafo Diagnóstico",
    "Eletrodos de ECG Descartáveis Ag/AgCl pct 50un", "Eletrodos Precordiais Tipo Ventosa Adulto (Jogo 6un)", "Eletrodos Periféricos Tipo Braçadeira / Clip (Jogo 4un)",
    "Gel Condutor para ECG e Ultrassom 5kg", "Sensor de Temperatura Cutâneo Tipo Skin Reutilizável", "Sensor de Temperatura Esofágico/Retal",
    "Célula Galvânica de Oxigênio (O2) para Ventilador", "Válvula Exalatória para Ventilador Mecânico Reutilizável", "Circuito Respiratório Adulto em Silicone Autoclavável",
    "Circuito Respiratório Pediátrico em Silicone", "Filtro HMEF Barreira Viral/Bacteriana pct 10un", "Pulmão de Teste Adulto em Silicone 1L",
    "Transdutor de Ultrassom Convexo 3.5MHz", "Transdutor de Ultrassom Linear 7.5MHz", "Transdutor Transvaginal Endocavitário 6.5MHz",
    "Pás Externas Adulto/Infantil para Desfibrilador", "Bateria de Lítio para Desfibrilador Bifásico", "Eletrodos Multifunções para DEA Descartáveis Adulto",
    "Eletrodos Multifunções para DEA Descartáveis Pediátrico", "Cabo Tronco de Oximetria Conector Redondo 7 Pinos", "Placa de Eletrocautério Inox Reutilizável com Cabo",
    "Caneta de Eletrobisturi com Comando Manual Descartável", "Eletrodo Tipo Faca para Bisturi Elétrico Inox", "Eletrodo Tipo Alça / Bola para Eletrobisturi",
    "Pedal de Acionamento Duplo Corte/Coagulação", "Bomba de Amostragem de Capnografia (EtCO2)", "Sensor de Capnografia Mainstream com Adaptador de Vias Aéreas",
    "Linha de Amostragem de Microstream com Filtro Desidratador", "Bateria para Bomba de Infusão 9.6V NiMH", "Mecanismo Peristáltico de Tração da Bomba de Infusão",
    "Sensor de Gotas / Fluxo Óptico para Bomba de Infusão", "Cabo de Alimentação Hospitalar Grau Médico 3x1.5mm", "Display LCD TFT 12.1 polegadas para Monitor de Sinais Vitais",
    "Placa Fonte de Alimentação Médica Isolada 65W", "Módulo de PNI Interno com Microbomba e Válvulas", "Módulo de ECG / Respiração de 12 Canais",
    "Termômetro Clínico Infravermelho Sem Contato", "Manga de Proteção para Transdutor de Ultrassom Estéril cx 100un"
  ];

  for (let i = 251; i <= 350; i++) {
    const cod = `PEC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 255) {
      const b = hospBase[i - 251];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 256) % hospNomes.length;
      desc = hospNomes[idx];
      preco = Math.round((11000 + ((i * 1741) % 88000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Peça de reposição e consumível para equipamentos médico-hospitalares`,
      categoria: "Equipamentos Hospitalares",
      preco: preco,
      precoCusto: Math.round(preco * 0.52),
      stock: 8 + (i % 30),
      stockMinimo: 4,
      unidadeMedida: desc.includes("pct") ? "pct" : desc.includes("Rolo") ? "rolo" : "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém C - Prateleira HOSP-${(i % 5) + 1}`,
      loteAtual: `LT-HOSP-${i}`,
      dataValidade: "31/12/2027",
    });
  }

  // =========================================================================
  // CATEGORIA 6: LAB QUÍMICO E FÍSICO [PEC351 - PEC450] (100 Itens)
  // =========================================================================
  const labQuimicoBase: [string, string, number][] = [
    ["PEC351", "Sensor de Temperatura PT100 Classe A Haste Inox", 16000],
    ["PEC352", "Termômetro Digital de Bancada com Alarme e Sonda", 15000],
    ["PEC353", "Placa Eletrônica Universal de Controle Laboratorial", 70000],
  ];

  const labQuimicoNomes = [
    "Eletrodo Combinado de pH Corpo de Vidro com ATC", "Eletrodo de pH Corpo Epóxi com Conector BNC", "Eletrodo de Condutividade K=1.0 com Sensor Temp",
    "Eletrodo de Íon Seletivo para Sódio / Potássio", "Cubeta de Quartzo UV 10mm Par (190-2500nm)", "Cubeta de Vidro Óptico 10mm Par (340-2500nm)",
    "Cubeta Semi-Micro de Fluxo Contínuo 10mm", "Lâmpada de Deutério (D2) para Espectrofotômetro", "Lâmpada de Tungstênio-Halogênio 12V 20W UV-VIS",
    "Filtro Holmium Óxido para Calibração de Comprimento de Onda", "Detector Fotodiodo de Silício para Espectrofotômetro", "Monocromador com Grade de Difração 1200 linhas/mm",
    "Sensor de Nível Condutivo em Inox para Destilador", "Resistência Blindada em Inox para Destilador 4000W", "Condensador de Vidro Borossilicato para Destilador",
    "Sensor de Turbidez Óptico com Saída 4-20mA", "Termômetro Químico de Vidro -10°C a +150°C", "Termo-Higrômetro Digital com Registro Máx/Mín",
    "Densímetro de Vidro para Soluções Líquidas 1.000-1.100", "Balança Analítica Prato de Pesagem em Inox 80mm", "Protetor Corta-Vento em Vidro para Balança Analítica",
    "Peso Padrão de Calibração Classe F1 100g Inox", "Peso Padrão de Calibração Classe F1 200g Inox", "Fonte de Alimentação 12V DC para Balança de Precisão",
    "Célula de Carga Extensométrica de Precisão 220g", "Controlador Digital de Temperatura PID com Relé SSR", "Sensor Termopar Tipo K com Cabo Trançado Inox",
    "Resistência Cerâmica Tubular para Mufla 1200°C", "Mufla Cerâmica Refratária com Isolamento Térmico", "Motor Ventilador para Circulação de Ar em Estufa",
    "Termostato de Segurança Bimetálico 250°C Estufa", "Sensor de CO2 por Infravermelho NDIR para Incubadora", "Válvula Redutora de Pressão Duplo Estágio para Cilindro CO2",
    "Filtro HEPA para Incubadora de Cultura Celular", "Módulo Peltier Termoelétrico 12V 60W para Refrigeração", "Dissipador de Calor em Alumínio com Cooler",
    "Bomba de Vácuo de Membrana PTFE Livre de Óleo", "Manômetro de Vácuo Analógico 0 a -1 Bar", "Armadilha de Vapor de Vidro para Linha de Vácuo"
  ];

  for (let i = 351; i <= 450; i++) {
    const cod = `PEC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 353) {
      const b = labQuimicoBase[i - 351];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 354) % labQuimicoNomes.length;
      desc = labQuimicoNomes[idx];
      preco = Math.round((12000 + ((i * 1619) % 95000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Instrumentação, sensores e peças para laboratórios químicos e físicos`,
      categoria: "Lab Químico e Físico",
      preco: preco,
      precoCusto: Math.round(preco * 0.48),
      stock: 5 + (i % 18),
      stockMinimo: 2,
      unidadeMedida: desc.includes("Par") ? "par" : "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém B - Prateleira LAB-${(i % 4) + 1}`,
      loteAtual: `LT-LAB-${i}`,
      dataValidade: "31/12/2028",
    });
  }

  // =========================================================================
  // CATEGORIA 7: PEÇAS ELETRÔNICAS UNIVERSAIS [PEC451 - PEC550] (100 Itens)
  // =========================================================================
  const eletrUniversalBase: [string, string, number][] = [
    ["PEC451", "Fonte Chaveada Industrial 24V 5A 120W Bivolt", 17000],
    ["PEC452", "Ventoinha Cooler 12V 80x80mm com Rolamento", 7500],
    ["PEC453", "Switch Interruptor Liga/Desliga Bipolar 16A", 3500],
    ["PEC454", "Potenciômetro Multivoltas de Precisão 10K", 4000],
  ];

  const eletroUniversalNomes = [
    "Fonte Chaveada 12V 10A 120W Perfil Baixo", "Fonte Chaveada 5V 5A 25W Miniatura", "Fonte de Alimentação Simétrica +15V/-15V para OpAmp",
    "Ventoinha Cooler 24V 120x120mm Alta Rotação", "Ventoinha Cooler 220V AC 120mm Carcaça Metálica", "Grade de Proteção Metálica para Cooler 80mm",
    "Filtro de Ar com Espuma para Ventilador 120mm", "Relé de Estado Sólido SSR 40A Entrada 3-32VDC Saída 24-380VAC", "Dissipador de Alumínio para Relé SSR",
    "Relé Eletromecânico 12VDC 10A 2 Contatos Reversíveis", "Soquete para Relé com Fixação em Trilho DIN", "Transformador Toroidal 220V / 24V-0-24V 100VA",
    "Controlador de Temperatura Digital PID RKC REX-C100", "Controlador Temporizador Digital com Display Duplo", "Fusível Cerâmico 5x20mm 2A Ação Rápida pct 10un",
    "Fusível Cerâmico 5x20mm 5A Ação Rápida pct 10un", "Fusível Cerâmico 6x30mm 10A Ação Retardada pct 10un", "Porta-Fusível de Painel Rosqueável 5x20mm",
    "Disjuntor Unipolar Curva C 10A Trilho DIN", "Disjuntor Bipolar Curva C 16A Trilho DIN", "Filtro de Linha EMI Supressor de Ruído 10A 250V",
    "Varistor de Óxido Metálico 275V para Proteção contra Surtos", "Termistor NTC 10K 3950 com Cabo 1m", "Conector LEMO Circular Autotravante Macho 4 Pinos",
    "Conector Painel LEMO Fêmea 4 Pinos", "Conector Circular Amphenol 6 Pinos Metálico", "Conector Jack DC 5.5x2.1mm com Porca de Fixação",
    "Conector Borneira em Barra KK Passo 5.08mm 4 Vias", "Display LCD 16x2 com Módulo I2C Soldado", "Display Gráfico LCD 128x64 com Backlight Amarelo",
    "Teclado Matricial de Membrana 4x4 Teclas", "Ponte Retificadora Monofásica 50A 1000V KBPC5010", "Capacitor Eletrolítico 4700uF 50V 105°C",
    "Regulador de Tensão Linear LM7805 TO-220", "Regulador de Tensão Linear LM7812 TO-220", "Regulador de Tensão Ajustável LM317T",
    "Microcontrolador ATmega328P DIP-28 com Bootloader", "Módulo Conversor USB-Serial FTDI FT232RL", "Isolador Óptico 4N35 DIP-6 pct 5un"
  ];

  for (let i = 451; i <= 550; i++) {
    const cod = `PEC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 454) {
      const b = eletrUniversalBase[i - 451];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 455) % eletroUniversalNomes.length;
      desc = eletroUniversalNomes[idx];
      preco = Math.round((2500 + ((i * 873) % 22000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Componente eletrónico universal e circuitos para equipamentos de bancada`,
      categoria: "Peças Eletrónicas Universais",
      preco: preco,
      precoCusto: Math.round(preco * 0.45),
      stock: 12 + (i % 40),
      stockMinimo: 5,
      unidadeMedida: desc.includes("pct") ? "pct" : "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém D - Gaveteiro ELE-${(i % 6) + 1}`,
      loteAtual: `LT-ELE-${i}`,
      dataValidade: "31/12/2030",
    });
  }

  // =========================================================================
  // CATEGORIA 8: CONSUMÍVEIS LABORATÓRIO [CON551 - CON700] (150 Itens)
  // =========================================================================
  const consumiveisBase: [string, string, number][] = [
    ["CON551", "Lâmina para Microscópio Lapidada Fosca cx 50un", 7000],
    ["CON552", "Lamínula de Vidro 22x22mm cx 100un", 5500],
    ["CON553", "Ponteira Azul 1000ul Universal pct 1000un", 18000],
    ["CON554", "Tubo Microcentrífuga Eppendorf 1.5ml pct 500un", 9000],
  ];

  const consumiveisNomes = [
    "Lâmina para Microscópio Lisa sem Fosco cx 50un", "Lâmina para Microscópio com Cavidade Simples cx 10un", "Lâmina de Contagem Câmara de Neubauer Espelhada",
    "Lamínula Especial para Câmara de Neubauer (Par)", "Lamínula de Vidro 24x50mm cx 100un", "Lamínula de Vidro 24x60mm cx 100un",
    "Ponteira Branca 10ul Universal pct 1000un", "Ponteira Amarela 200ul Universal pct 1000un", "Ponteira 1000ul com Filtro Barreira Estéril pct 96un",
    "Ponteira 200ul com Filtro Barreira Estéril pct 96un", "Ponteira 10ul com Filtro Barreira Estéril pct 96un", "Rack Porta-Ponteiras 1000ul Autoclavável",
    "Rack Porta-Ponteiras 200ul Autoclavável", "Tubo Eppendorf 0.5ml Graduado pct 500un", "Tubo Eppendorf 2.0ml Fundo Cônico pct 500un",
    "Tubo Cônico de Ensaio 15ml Tampa Rosca estéril pct 50un", "Tubo Cônico de Ensaio 50ml Tampa Rosca estéril pct 25un", "Estante Suporte para Tubos 15ml / 50ml",
    "Tubo de Coleta a Vácuo EDTA K2 4ml cx 100un", "Tubo de Coleta a Vácuo Gel Separador + Ativador 4ml cx 100un", "Tubo de Coleta a Vácuo Citrato de Sódio 3.2% cx 100un",
    "Tubo de Coleta a Vácuo Fluoreto de Sódio / EDTA 2ml cx 100un", "Agulha Múltipla para Coleta a Vácuo 21G cx 100un", "Agulha Múltipla para Coleta a Vácuo 22G cx 100un",
    "Adaptador Canhão Suporte para Tubo a Vácuo cx 100un", "Escalpe com Dispositivo de Segurança 21G pct 50un", "Escalpe com Dispositivo de Segurança 23G pct 50un",
    "Garrote de Borracha com Fecho Rápido Hospitalar", "Algodão Hidrófilo Hospitalar Rolo 500g", "Curativo Adesivo Pós-Coleta Tipo Band-Aid cx 500un",
    "Placa de Petri Descartável Estéril 90x15mm pct 10un", "Placa de Petri em Vidro Borossilicato 100mm", "Alça Bacteriológica Calibrada 10ul Descartável pct 100un",
    "Alça Bacteriológica de Platina com Cabo Mandril", "Swab Estéril em Tubo com Meio Stuart pct 100un", "Swab de Algodão Haste de Madeira pct 100un",
    "Papel de Filtro Qualitativo Círculos 12.5cm cx 100un", "Papel de Filtro Quantitativo Faixa Azul cx 100un", "Fita Indicadora de pH 0-14 Universal cx 100 tiras",
    "Fita Teste de Glicose Urina / Sangue cx 50un", "Cubeta Descartável para Coagulômetro pct 500un", "Recipiente para Coleta de Urina Estéril 80ml cx 100un",
    "Recipiente para Coleta de Fezes com Pá 30ml cx 100un", "Saco de Risco Biológico Autoclavável 30L pct 50un", "Saco de Risco Biológico Autoclavável 50L pct 50un",
    "Caixa Descarpack Coletora Perfurocortante 7L", "Marcador Permanente para Vidraria e Tubos (Preto/Azul)", "Óleo de Imersão Sintético Baixa Fluorescência 500ml"
  ];

  for (let i = 551; i <= 700; i++) {
    const cod = `CON${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 554) {
      const b = consumiveisBase[i - 551];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 555) % consumiveisNomes.length;
      desc = consumiveisNomes[idx];
      preco = Math.round((3500 + ((i * 743) % 28000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Consumíveis plásticos e descartáveis de alta pureza para rotina laboratorial`,
      categoria: "Consumíveis Laboratório",
      preco: preco,
      precoCusto: Math.round(preco * 0.5),
      stock: 25 + (i % 70),
      stockMinimo: 10,
      unidadeMedida: desc.includes("cx") ? "cx" : desc.includes("pct") ? "pct" : desc.includes("Rolo") ? "rolo" : "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém A - Setor CONS-${(i % 5) + 1}`,
      loteAtual: `LT-CON-${i}`,
      dataValidade: "31/12/2027",
    });
  }

  // =========================================================================
  // CATEGORIA 9: ACESSÓRIOS E FERRAMENTAS [ACC701 - ACC800] (100 Itens)
  // =========================================================================
  const ferramentasBase: [string, string, number][] = [
    ["ACC701", "Kit Ferramentas Técnico em Eletromedicina Completo", 120000],
    ["ACC702", "Alicate de Precisão Corte Rente ESD", 8000],
    ["ACC703", "Chave de Fenda e Philips Jogo 10pcs Precisão", 12000],
  ];

  const ferramentasNomes = [
    "Multímetro Digital True RMS Auto-Range CAT III 600V", "Pontas de Prova Blindadas para Multímetro com Garras Jacaré",
    "Alicate Amperímetro Digital AC/DC True RMS", "Estação de Solda e Retrabalho SMD Digital 2 em 1 750W", "Ferro de Soldar 60W com Controle de Temperatura",
    "Ponta de Solda Fina Cônica / Chanfrada para Estação (Jogo 5un)", "Rolo de Solda Estanho/Chumbo 63/37 0.8mm 250g",
    "Fluxo de Solda Pastoso No-Clean Seringa 10cc", "Malha Dessoldadora de Cobre 2.5mm x 1.5m", "Bomba Sugadora de Solda em Alumínio Anti-Estática",
    "Pinça de Precisão ESD em Aço Inox Ponta Curva", "Pinça de Precisão ESD em Aço Inox Ponta Reta Ultrafina", "Manta Antiestática de Silicone para Bancada com Aterramento",
    "Pulseira Antiestática sem Fio / com Cabo Espiral", "Lupa de Bancada com Braço Articulado e Iluminação LED", "Microscópio Digital de Inspeção USB 1000X",
    "Chave de Torque Calibrada para Conectores Médicos", "Jogo de Chaves Torx de Segurança T5 a T20", "Jogo de Chaves Allen Hexagonais Métricas em Aço Cromo-Vanádio",
    "Extrator de Circuitos Integrados DIP Tipo Pinça", "Soprador Térmico Portátil 2000W com Bicos Direcionais", "Termômetro Infravermelho Mira Laser -50°C a 550°C",
    "Tacômetro Digital Laser sem Contato para Centrífugas", "Simulador de Paciente ECG / Sinais Vitais Portátil", "Analisador de Segurança Elétrica Hospitalar Conforme IEC 60601",
    "Maleta de Transporte em Alumínio com Espuma Recortável", "Kit de Chaves de Fenda Isoladas 1000V VDE", "Alicate Decapador e Crimpador de Fios Automático",
    "Kit Conectores de Terminais Pré-Isolados e Prensa-Cabos", "Spray Limpa-Contatos Elétricos Isento de CFC 300ml", "Spray Congelante para Detecção de Falhas Térmicas 300ml",
    "Graxa Especial para Mecanismos de Precisão 50g", "Pincel Antiestático com Cerdas Condutivas (Kit 3un)", "Fita Isolante de Autofusão Alta Tensão 19mm x 5m",
    "Fita Dupla Face Térmica Dissipadora de Calor 20mm"
  ];

  for (let i = 701; i <= 800; i++) {
    const cod = `ACC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 703) {
      const b = ferramentasBase[i - 701];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 704) % ferramentasNomes.length;
      desc = ferramentasNomes[idx];
      preco = Math.round((4500 + ((i * 1237) % 40000)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Ferramenta técnica profissional e acessório de manutenção eletromédica`,
      categoria: "Acessórios e Ferramentas",
      preco: preco,
      precoCusto: Math.round(preco * 0.5),
      stock: 4 + (i % 15),
      stockMinimo: 2,
      unidadeMedida: desc.includes("Jogo") || desc.includes("Kit") ? "kit" : "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Oficina Técnica - Prateleira FER-${(i % 4) + 1}`,
      loteAtual: `LT-FER-${i}`,
      dataValidade: "31/12/2030",
    });
  }

  // =========================================================================
  // CATEGORIA 10: SOFTWARE E TREINAMENTO [SW801 - SW850] (50 Itens)
  // =========================================================================
  const softwareBase: [string, string, number][] = [
    ["SW801", "Licença Software LIMS Gestão Laboratorial 1 Ano", 300000],
    ["SW802", "Módulo de Facturação e Certificação AGT Extra", 150000],
  ];

  const softwareNomes = [
    "Módulo de Integração HL7 / ASTM com Analisadores de Sangue", "Software de Captura e Morfometria Celular em Microscopia",
    "Módulo de Gestão de Controlo de Qualidade Levey-Jennings / Westgard", "Licença de Calibração Metrológica e Emissão de Certificados",
    "Módulo de Agendamento Online e Portal do Paciente / Cliente", "Módulo de Assinatura Digital Certificada de Laudos Médicos",
    "Software de Gestão de Manutenção Preventiva Hospitalar (GMAO)", "Licença de Banco de Dados SQL Server para Laboratório",
    "Módulo de Gestão de Estoque e Rastreabilidade por Lote e Validade", "Módulo de Envio Automático de Resultados por SMS e E-mail",
    "Driver de Comunicação Serial RS232 / TCP para Equipamentos Antigos", "Treinamento Operacional de Microscópio e Manutenção Básica 2h",
    "Treinamento Operacional de Autoclave e Biossegurança 4h", "Treinamento em Metrologia e Calibração de Balanças e Pipetas 4h",
    "Curso Avançado de Interpretação de Diagramas em Eletromedicina 8h", "Consultoria de Implantação e Parametrização LIMS 10h",
    "Pacote de Horas de Suporte Técnico de Software Nível 2 (5h)", "Pacote de Atualização Anual de Firmware e Banco de Dados",
    "Treinamento de Boas Práticas de Laboratório Clínico (BPLC) 6h", "Certificação de Operador Qualificado de Analisador Hematológico",
    "Módulo de Backup Automatizado em Nuvem Criptografado Anual", "Módulo de Relatórios Gerenciais e Indicadores de Desempenho (BI)",
    "Licença de Software de Aquisição de Sinais de ECG 12 Canais", "Software de Análise Espetral UV-VIS para Espectrofotômetros",
    "Treinamento de Segurança Elétrica em Equipamentos Médicos 4h"
  ];

  for (let i = 801; i <= 850; i++) {
    const cod = `SW${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 802) {
      const b = softwareBase[i - 801];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 803) % softwareNomes.length;
      desc = softwareNomes[idx];
      preco = Math.round((25000 + ((i * 4821) % 225000)) / 1000) * 1000;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Licenciamento de software clínico/laboratorial e programas de capacitação técnica`,
      categoria: "Software e Treinamento",
      preco: preco,
      precoCusto: Math.round(preco * 0.2),
      stock: 999,
      stockMinimo: 0,
      unidadeMedida: desc.includes("Treinamento") || desc.includes("Curso") ? "curso" : "licença",
      ivaIsento: false,
      ativo: true,
      localizacao: "Servidor Digital / Centro de Treinamento",
    });
  }

  // =========================================================================
  // CATEGORIA 11: SERVIÇOS ESPECIAIS [SVC851 - SVC900] (50 Itens)
  // =========================================================================
  const servicosEspeciaisBase: [string, string, number][] = [
    ["SVC851", "Auditoria Técnica e Diagnóstico Completo de Parque Tecnológico", 200000],
    ["SVC852", "Consultoria para Acreditação Laboratorial ISO 15189", 500000],
  ];

  const servicosEspeciaisNomes = [
    "Qualificação Térmica com Mapeamento 9 Pontos de Autoclaves", "Qualificação Térmica de Freezers -80°C e Câmaras Frias",
    "Qualificação Térmica de Estufas de Secagem e Incubadoras", "Certificação e Contagem de Partículas em Salas Limpas / Fluxo Laminar",
    "Ensaio de Segurança Elétrica Hospitalar Norma IEC 60601 com Laudo", "Levantamento Radiométrico e Proteção Radiológica em Raio X",
    "Consultoria de Adequação de Instalações Elétricas e Aterramento Hospitalar", "Desenvolvimento de Plano Diretor de Tecnologia em Saúde (PDTS)",
    "Contrato Mensal de Manutenção Preventiva para Laboratório Médio Porte", "Contrato Mensal de Manutenção Preventiva para Clínica Geral",
    "Perícia Técnica e Parecer de Descarte de Equipamentos Obsoletos", "Calibração e Ajuste de Espectrofotômetro com Padrões Certificados NIST",
    "Calibração de Centrífugas com Estroboscópio e Tacômetro Digital", "Calibração de Banho-Maria e Termoblocos com Sensor Termopar Padrão",
    "Calibração Rastreável de Medidores de pH e Condutivímetros", "Elaboração de Procedimentos Operacionais Padrão (POP) de Manutenção",
    "Validação de Métodos Analíticos Automatizados", "Auditoria de Biossegurança e Gestão de Resíduos Hospitalares",
    "Inspeção e Teste de Estanqueidade de Redes de Gases Medicinais", "Higienização e Descontaminação Terminal de Equipamentos Críticos",
    "Serviço de Plantão Técnico Emergencial 24h em Luanda", "Assessoria na Aquisição e Especificação de Novos Equipamentos Médicos",
    "Supervisão e Fiscalização de Obras de Instalação de Equipamentos Pesados", "Manutenção Especializada em Ventiladores Mecânicos de UTI",
    "Deslocamento de Equipe Técnica Especializada Províncias (Diária)"
  ];

  for (let i = 851; i <= 900; i++) {
    const cod = `SVC${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 852) {
      const b = servicosEspeciaisBase[i - 851];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 853) % servicosEspeciaisNomes.length;
      desc = servicosEspeciaisNomes[idx];
      preco = Math.round((35000 + ((i * 6719) % 365000)) / 1000) * 1000;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Serviço de alta complexidade em engenharia clínica e metrologia hospitalar`,
      categoria: "Serviços Especiais",
      preco: preco,
      precoCusto: Math.round(preco * 0.25),
      stock: 999,
      stockMinimo: 0,
      unidadeMedida: "serv",
      ivaIsento: false,
      ativo: true,
      localizacao: "Departamento de Engenharia Clínica",
    });
  }

  // =========================================================================
  // CATEGORIA 12: ITENS DIVERSOS [DIV901 - DIV999] (99 Itens)
  // =========================================================================
  const diversosBase: [string, string, number][] = [
    ["DIV901", "Álcool Isopropílico 99.8% Frasco 1 Litro", 8000],
    ["DIV902", "Detergente Enzimático Hospitalar 4 Enzimas 1 Litro", 14000],
    ["DIV903", "Etiqueta Térmica para Amostras e Tubos 50x25mm Rolo 1000un", 9000],
  ];

  const diversosNomes = [
    "Água Desionizada Bidestilada Grau Laboratório Galão 5L", "Solução Tampão de Calibração pH 4.01 Frasco 500ml", "Solução Tampão de Calibração pH 7.00 Frasco 500ml",
    "Solução Tampão de Calibração pH 10.01 Frasco 500ml", "Solução Padrão de Condutividade 1413 uS/cm Frasco 500ml", "Solução de Armazenamento para Eletrodo de pH (KCl 3M) 250ml",
    "Solução de Limpeza de Eletrodos com Pepsina 250ml", "Detergente Neutro para Limpeza de Vidrarias Extran 1L", "Hipoclorito de Sódio Hospitalar 2.5% Galão 5L",
    "Álcool Etílico 70% Desinfetante Hospitalar 1L", "Álcool em Gel 70% com Válvula Pump 500ml", "Fita Indicadora Química de Esterilização a Vapor Rolo 50m",
    "Indicador Biológico para Autoclave a Vapor (Geobacillus) cx 50un", "Incubadora para Indicadores Biológicos 56°C 12 Cavidades",
    "Papel Toalha Interfolhado 100% Celulose Virgem pct 1000fls", "Sabonete Líquido Antisséptico com Clorexidina 2% 1L", "Luvas de Látex com Pó para Procedimento cx 100un (P/M/G)",
    "Luvas de Nitrilo sem Pó Resistentes a Químicos cx 100un", "Máscara Descartável Tripla com Elástico e Clipe Nasal cx 50un", "Máscara Respirador N95 / PFF2 Hospitalar cx 20un",
    "Avental Descartável Manga Longa TNT 30g pct 10un", "Touca Descartável Sanfonada em TNT pct 100un", "Propé Descartável em TNT Antiderrapante pct 100un",
    "Óculos de Proteção Ampla Visão com Ventilação Indireta", "Protetor Facial Face Shield em Policarbonato Reutilizável", "Suporte Metálico para Rolo de Papel Toalha de Bancada",
    "Frasco Lavador (Pisseta) em Polietileno Bico Curvo 500ml", "Frasco Conta-Gotas Âmbar 30ml com Cânula de Vidro", "Cilindro Graduado (Proveta) de Vidro 100ml",
    "Cilindro Graduado (Proveta) de Vidro 500ml", "Béquer de Vidro Borossilicato Forma Baixa 250ml", "Béquer de Vidro Borossilicato Forma Baixa 600ml",
    "Frasco Erlenmeyer Boca Estreita 250ml", "Tubo de Ensaio Vidro Neutro 16x150mm pct 100un", "Escova para Limpeza de Tubos de Ensaio Haste Arame",
    "Espátula Dupla em Aço Inox para Pós e Reagentes", "Pilão com Pistilo em Porcelana 100mm", "Vidro de Relógio 80mm em Vidro Neutro",
    "Termômetro Digital com Sensor Externo para Geladeira / Vacinas", "Registrador de Temperatura USB Datalogger Descartável", "Papel Indicador de Umidade Silica Gel Sachê 5g pct 100un"
  ];

  for (let i = 901; i <= 999; i++) {
    const cod = `DIV${String(i).padStart(3, "0")}`;
    let desc = "";
    let preco = 0;

    if (i <= 903) {
      const b = diversosBase[i - 901];
      desc = b[1];
      preco = b[2];
    } else {
      const idx = (i - 904) % diversosNomes.length;
      desc = diversosNomes[idx];
      preco = Math.round((1500 + ((i * 517) % 48500)) / 500) * 500;
    }

    items.push({
      id: i,
      codigo: cod,
      codigoBarras: generateEAN13(i),
      nome: desc,
      descricao: `Material diverso, reagente e insumo técnico - Dr. Elias Med Lab Tech`,
      categoria: "Itens Diversos",
      preco: preco,
      precoCusto: Math.round(preco * 0.45),
      stock: 15 + (i % 50),
      stockMinimo: 5,
      unidadeMedida: desc.includes("Litro") || desc.includes("1L") || desc.includes("5L") ? "litro" : desc.includes("cx") ? "cx" : desc.includes("pct") ? "pct" : desc.includes("Rolo") ? "rolo" : "un",
      ivaIsento: false,
      ativo: true,
      localizacao: `Armazém Geral - Prateleira DIV-${(i % 5) + 1}`,
      loteAtual: `LT-DIV-${i}`,
      dataValidade: "31/12/2027",
    });
  }

  return items;
})();
