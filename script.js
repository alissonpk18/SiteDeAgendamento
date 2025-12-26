// JavaScript Principal
// JavaScript Principal
// Depende de: config.js

document.addEventListener('DOMContentLoaded', () => {
    // Carregar Turnos e Serviços Dinamicamente
    loadDropdowns();

    // Referências
    const bookingForm = document.getElementById('bookingForm');
    const bookingDateInput = document.getElementById('bookingDate');
    const bookingTimeSelect = document.getElementById('bookingTime');
    const submitBtn = bookingForm ? bookingForm.querySelector('button[type="submit"]') : null;

    // Verificação de Disponibilidade ao mudar Data
    // Verificação de Disponibilidade ao mudar Data
    let datePicker;

    async function handleDateSelection(dateStr) {
            if (!dateStr) return;

            // UI Reset
            resetTimeSlots();
            const feedbackEl = document.getElementById('bookingFeedback');
            if (feedbackEl) {
                feedbackEl.classList.add('d-none');
                feedbackEl.innerText = '';
                feedbackEl.className = 'alert alert-warning d-none small py-2'; // Reset classes
            }
            
            if (submitBtn) submitBtn.disabled = true;
            bookingTimeSelect.disabled = true;
            const originalPlaceholder = bookingTimeSelect.options[0].text;
            bookingTimeSelect.options[0].text = "Verificando disponibilidade...";

            try {
                const response = await fetch(`${Config.API_URL}?action=getAvailability&date=${dateStr}`);
                const data = await response.json();

                if (data.status === 'success') {
                     // 1. Caso Bloqueado
                     if (data.isBlocked) {
                         showFeedback(`⚠️ Dia Indisponível: ${data.blockedReason || 'Fechado/Bloqueado'}`, 'danger');
                         if(datePicker) datePicker.clear();
                         resetTimeSlots();
                         return; 
                     }

                     // 2. Caso Lotado (Limite de pessoas)
                     if (data.isFull) {
                         showFeedback(`⚠️ Agenda lotada para este dia! Restam 0 vagas.`, 'danger');
                         if(datePicker) datePicker.clear();
                         return;
                     }

                     // 3. Horário Especial / Funcionamento
                     // Force generating slots based on this schedule
                     if (data.specialSchedule) {
                         const start = data.specialSchedule.start;
                         const end = data.specialSchedule.end;
                         const reason = data.specialSchedule.reason ? ` (${data.specialSchedule.reason})` : '';
                         showFeedback(`ℹ️ Horário de Funcionamento: ${start} às ${end}${reason}`, 'info');
                         
                         // Generate Slots Dynamically
                         generateTimeSlots(start, end);
                     } else {
                        // Fallback? If no schedule returned, maybe assume default or clear
                        // For now let's clear or show warning
                         showFeedback(`⚠️ Sem horários definidos para este dia.`, 'warning');
                         resetTimeSlots(true); // Clear all
                     }

                     // Atualizar Slots Ocupados (e Horários Especiais)
                     if ((data.busySlots && Array.isArray(data.busySlots)) || data.specialSchedule) {
                         updateBusySlots(data);
                     }
                } else {
                    console.error("Erro na API:", data.message);
                }

            } catch (error) {
                console.error("Erro ao verificar disponibilidade:", error);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
                bookingTimeSelect.disabled = false;
                bookingTimeSelect.options[0].text = originalPlaceholder;
            }
    }

    async function fetchMonthAvailability(year, month, instance) {
        try {
            // Disable navigation while loading?
            const feedbackEl = document.getElementById('bookingFeedback');
            // feedbackEl.classList.remove('d-none');
            // feedbackEl.innerText = "Atualizando calendário...";

            const response = await fetch(`${Config.API_URL}?action=getMonthStatus&year=${year}&month=${month}`);
            const data = await response.json();

            if (data.status === 'success' && data.disabledDates) {
                instance.set('disable', data.disabledDates);
            }
        } catch (e) {
            console.error("Erro ao buscar mês:", e);
        }
    }

    if (bookingDateInput) {
        datePicker = flatpickr(bookingDateInput, {
            locale: "pt",
            dateFormat: "Y-m-d",
            minDate: "today",
            disableMobile: "true", // Force custom UI on mobile for better disabling support
            onMonthChange: (selectedDates, dateStr, instance) => {
                fetchMonthAvailability(instance.currentYear, instance.currentMonth + 1, instance);
            },
            onReady: (selectedDates, dateStr, instance) => {
                 fetchMonthAvailability(instance.currentYear, instance.currentMonth + 1, instance);
            },
            onChange: (selectedDates, dateStr, instance) => {
                handleDateSelection(dateStr);
            }
        });
    }

    function showFeedback(msg, type = 'warning') {
        const el = document.getElementById('bookingFeedback');
        if (el) {
            el.innerText = msg;
            el.classList.remove('d-none', 'alert-warning', 'alert-danger', 'alert-info');
            el.classList.add(`alert-${type}`);
            el.classList.remove('d-none');
        }
    }

    function resetTimeSlots(clearAll = false) {
        if (!bookingTimeSelect) return;
        
        if (clearAll) {
             bookingTimeSelect.innerHTML = '<option value="" selected disabled>Nenhum horário disponível</option>';
             return;
        }

        Array.from(bookingTimeSelect.options).forEach(opt => {
            opt.disabled = false;
            // Remove sufixo (Ocupado) se houver
            opt.innerText = opt.innerText.replace(' (Ocupado)', '').replace(' (Indisponível)', '');
        });
    }

    function generateTimeSlots(startStr, endStr) {
        if (!bookingTimeSelect || !Config.SLOT_DURATION) return;
        
        // Clear current options
        bookingTimeSelect.innerHTML = '<option value="" selected disabled>Escolha um horário...</option>';
        
        // Parse "HH:mm" to minutes
        const toMinutes = (s) => {
            const [h, m] = s.split(':').map(Number);
            return h * 60 + m;
        };
        
        const startMin = toMinutes(startStr);
        const endMin = toMinutes(endStr);
        const duration = Config.SLOT_DURATION;
        
        // Loop generating slots
        for (let time = startMin; time < endMin; time += duration) {
            // Format back to HH:mm
            const h = Math.floor(time / 60).toString().padStart(2, '0');
            const m = (time % 60).toString().padStart(2, '0');
            const timeLabel = `${h}:${m}`;
            
            const opt = document.createElement('option');
            opt.value = timeLabel;
            opt.innerText = timeLabel;
            bookingTimeSelect.appendChild(opt);
        }
    }

    function updateBusySlots(data) {
        if (!bookingTimeSelect) return;
        const busySlots = data.busySlots || [];
        const specialSchedule = data.specialSchedule;

        Array.from(bookingTimeSelect.options).forEach(opt => {
             let unavailable = false;

            // 1. Check Schedule (Slots Filtering)
            // No longer needed here as we generate slots BASED on schedule.
            // But we can check for breaks if needed later.
            
            // Check if slot overrides logic? No, simplifed.
            // Just check exact busy slots.
             if (specialSchedule && specialSchedule.start && specialSchedule.end) {
                  // Legacy check or Break check if implemented
             }

            // 2. Check Busy Slots (Already Booked)
            // REMOVED: Logic that blocks slot if ANYONE booked it. 
            // Now we rely on Daily Limit (isFull) to block the whole day.
            
            if (unavailable) {
                opt.disabled = true;
                 if (!opt.innerText.includes('(Indisponível)')) opt.innerText += ' (Indisponível)';
            }
        });
    }
    
    function loadDropdowns() {
        // Carregar Serviços
        const serviceSelect = document.getElementById('serviceType');
        if (serviceSelect && Config.SERVICES) {
            serviceSelect.innerHTML = '<option value="" selected disabled>Selecione uma opção...</option>';
            Config.SERVICES.forEach(svc => {
                const opt = document.createElement('option');
                opt.value = svc;
                opt.innerText = svc;
                serviceSelect.appendChild(opt);
            });
        }

        const timeSelect = document.getElementById('bookingTime');
        // Initial state: Empty until date selected
        if (timeSelect) {
             timeSelect.innerHTML = '<option value="" selected disabled>Selecione a data primeiro</option>';
        }
    }
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Verificando disponibilidade... <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';

            try {
                // Dados do Cliente
                const name = document.getElementById('clientName').value;
                const service = document.getElementById('serviceType').value;
                const dateInput = document.getElementById('bookingDate').value; // YYYY-MM-DD
                const time = document.getElementById('bookingTime').value;

                // Tentar reservar no Google Sheets usando Config
                if (Config.API_URL) {
                    const response = await fetch(Config.API_URL, {
                        method: 'POST',
                        // mode: 'no-cors', // REMOVIDO para ler resposta
                        headers: { 'Content-Type': 'text/plain' }, // Hack para evitar preflight em Apps Script
                        body: JSON.stringify({
                            action: 'book',
                            name: name,
                            service: service,
                            date: dateInput,
                            time: time
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.status === 'error') {
                        throw new Error(result.message);
                    }
                }

                // Formatar Data (DD/MM)
                const dateObj = new Date(dateInput + 'T00:00:00');
                const dateFormatted = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                // Avisar Sucesso (Feedback Visual)
                // alert(`✅ Pré-Agendamento realizado para dia ${dateFormatted}!\n\nAgora envie a mensagem no WhatsApp para confirmar com a Selma.`);

                // Construir Mensagem
                const message = `Olá! Sou *${name}*. Gostaria de confirmar meu agendamento de *${service}* no *${Config.BUSINESS_NAME}* para dia *${dateFormatted}* (${time}).`;
                
                // Redirecionar
                const whatsappUrl = `https://wa.me/${Config.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
                
                // Fechar Modal de Agendamento
                const modalEl = document.getElementById('agendamentoModal');
                const modal = bootstrap.Modal.getInstance(modalEl);
                modal.hide();
                bookingForm.reset();

                // Configurar e Abrir Modal de Sucesso
                const successModalEl = document.getElementById('successModal');
                const btnConfirm = document.getElementById('btnConfirmWhatsApp');
                
                if (successModalEl && btnConfirm) {
                    btnConfirm.href = whatsappUrl;
                    const successModal = new bootstrap.Modal(successModalEl);
                    successModal.show();
                } else {
                    // Fallback se não encontrar modal
                    window.open(whatsappUrl, '_blank');
                }

            } catch (error) {
                console.error('Erro no agendamento:', error);
                alert('⚠️ Não foi possível realizar o agendamento automático: ' + error.message);
                // Opcional: Redirecionar mesmo com erro? Melhor não se estiver bloqueado.
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }
});
