import { supabase } from './supabaseClient';
import { Customer, Expo, Visit, TechCategory, PricingRecord, ContactPerson, Project, Vendor, VendorType, ProjectType, Expense } from '../types';
import { INDIA_GEO_DATA } from '../constants';

// --- CUSTOMERS ---

// --- SCHEMA RESILIENCE HELPERS ---
const _missingColumns = new Set<string>();

async function _safeInsert(table: string, data: any | any[], isSingle: boolean = false) {
    let attemptData = Array.isArray(data)
        ? data.map(d => ({ ...d }))
        : { ...data };

    // Strip known missing columns first
    const strip = (obj: any) => {
        _missingColumns.forEach(col => delete obj[col]);
    };

    if (Array.isArray(attemptData)) attemptData.forEach(strip);
    else strip(attemptData);

    let result = isSingle
        ? await supabase.from(table).insert(attemptData).select().single()
        : await supabase.from(table).insert(attemptData).select('id');

    if (result.error) {
        const msg = result.error.message;
        // Detect "column not found" error
        if (msg.includes("column") && (msg.includes("not find") || msg.includes("does not exist"))) {
            // Extract column name from error message (PostgREST style)
            const match = msg.match(/column "(.*?)"/i) || msg.match(/column (.*?) /i);
            const colName = match ? match[1] : null;

            if (colName && !_missingColumns.has(colName)) {
                console.warn(`Detected missing column in DB table '${table}': ${colName}. Retrying without it.`);
                _missingColumns.add(colName);
                // Recursive retry
                return _safeInsert(table, data, isSingle);
            }
        }
    }
    return result;
}

export const api = {
    customers: {
        async fetchAll(): Promise<Customer[]> {
            try {
                let allCustomers: any[] = [];
                let hasMore = true;
                let page = 0;
                const pageSize = 1000;

                while (hasMore) {
                    // We need to fetch contacts and pricing_history too, but careful with join limits.
                    // Ideally we fetch basic data first, then joins, or just fetch all with joins if payload isn't massive.
                    // For now, let's try fetching with joins in batches.
                    const { data, error } = await supabase
                        .from('customers')
                        .select('*, contacts(*), pricing_history(*)')
                        .range(page * pageSize, (page + 1) * pageSize - 1);

                    if (error) {
                        console.error("Supabase customers fetch error (batch):", error);
                        // Fallback mechanism logic from original code is complex to replicate in loop without bloat.
                        // If batch fails, we might abort. Let's assume standard fetch works.
                        throw error;
                    }

                    if (data) {
                        allCustomers = [...allCustomers, ...data];
                        if (data.length < pageSize) {
                            hasMore = false;
                        } else {
                            page++;
                        }
                    } else {
                        hasMore = false;
                    }
                }

                return allCustomers.map(row => this.mapRowToCustomer(row, row.contacts, row.pricing_history));
            } catch (err) {
                console.error("Critical failure in customers.fetchAll:", err);
                return [];
            }
        },

        mapRowToCustomer(row: any, contacts: any[], pricingHistory: any[]): Customer {
            return {
                id: row.id,
                name: row.name,
                city: row.city || 'N/A',
                state: row.state || 'N/A',
                country: row.country || 'India',
                zone: (row.zone || INDIA_GEO_DATA[row.state]?.zone) as any,
                annualTurnover: row.annual_turnover || 0,
                projectTurnover: row.project_turnover || 0,
                industry: row.industry || 'Manufacturing',
                industryType: row.industry_type,
                machineTypes: row.machine_types || [],
                companySize: row.company_size,
                coords: row.coords,
                isDiscovered: row.is_discovered,
                areaSector: row.area_sector,
                pincode: row.pincode,
                status: row.status,
                enquiryNo: row.enquiry_no,
                lastDate: row.last_date,
                contacts: (contacts || []).map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    designation: c.designation,
                    email: c.email,
                    phone: c.phone
                })),
                pricingHistory: (pricingHistory || []).map((p: any) => ({
                    id: p.id,
                    customerId: p.customer_id,
                    tech: p.tech as TechCategory,
                    rate: p.rate,
                    unit: p.unit,
                    date: p.date,
                    salesPerson: p.sales_person,
                    industry: p.industry,
                    city: p.city,
                    state: p.state,
                    productName: p.product_name,
                    drawingNo: p.drawing_no,
                    materialType: p.material_type,
                    machineType: p.machine_type,
                    process: p.process,
                    moq: p.moq,
                    quotedQty: p.quoted_qty,
                    rawMaterialCost: p.raw_material_cost,
                    machiningCost: p.machining_cost,
                    laborCost: p.labor_cost,
                    overhead: p.overhead,
                    transportationCost: p.transportation_cost,
                    otherCharges: p.other_charges,
                    totalAmount: p.total_amount,
                    marginPercent: p.margin_percent,
                    currency: p.currency,
                    validTill: p.valid_till,
                    paymentMode: p.payment_mode,
                    creditDays: p.credit_days,
                    advancePercent: p.advance_percent,
                    gstIncluded: p.gst_included,
                    status: p.status
                })),
                lastModifiedBy: row.last_modified_by,
                updatedAt: row.updated_at
            };
        },

        async create(customer: Customer): Promise<Customer> {
            try {
                const zone = INDIA_GEO_DATA[customer.state]?.zone || customer.zone;
                const insertData: any = {
                    name: customer.name,
                    city: customer.city,
                    state: customer.state,
                    country: customer.country,
                    annual_turnover: customer.annualTurnover,
                    project_turnover: customer.projectTurnover,
                    industry: customer.industry,
                    industry_type: customer.industryType,
                    machine_types: customer.machineTypes,
                    company_size: customer.companySize,
                    coords: customer.coords,
                    status: customer.status,
                    enquiry_no: customer.enquiryNo,
                    last_date: customer.lastDate,
                    last_modified_by: customer.lastModifiedBy,
                    updated_at: new Date().toISOString()
                };

                const { data, error } = await _safeInsert('customers', insertData, true);

                if (error) {
                    console.error("Customers create error:", error);
                    throw error;
                }
                const newId = data.id;

                if (customer.contacts && customer.contacts.length > 0) {
                    const contactsToInsert = customer.contacts.map(c => ({
                        customer_id: newId,
                        name: c.name,
                        designation: c.designation,
                        email: c.email,
                        phone: c.phone
                    }));
                    await supabase.from('contacts').insert(contactsToInsert);
                }

                return { ...customer, id: newId, zone: zone as any };
            } catch (err: any) {
                console.error("Critical failure in customers.create:", err);
                throw err;
            }
        },

        async update(customer: Customer): Promise<void> {
            const zone = INDIA_GEO_DATA[customer.state]?.zone || customer.zone;
            const { error } = await supabase
                .from('customers')
                .update({
                    name: customer.name,
                    city: customer.city,
                    state: customer.state,
                    country: customer.country,
                    annual_turnover: customer.annualTurnover,
                    project_turnover: customer.projectTurnover,
                    industry: customer.industry,
                    industry_type: customer.industryType,
                    machine_types: customer.machineTypes,
                    company_size: customer.companySize,
                    coords: customer.coords,
                    status: customer.status,
                    enquiry_no: customer.enquiryNo,
                    last_date: customer.lastDate,
                    last_modified_by: customer.lastModifiedBy,
                    updated_at: new Date().toISOString()
                })
                .eq('id', customer.id);

            if (error) throw error;

            await supabase.from('contacts').delete().eq('customer_id', customer.id);

            if (customer.contacts && customer.contacts.length > 0) {
                const contactsToInsert = customer.contacts.map(c => ({
                    customer_id: customer.id,
                    name: c.name,
                    designation: c.designation,
                    email: c.email,
                    phone: c.phone
                }));
                await supabase.from('contacts').insert(contactsToInsert);
            }
        },

        async delete(id: string): Promise<void> {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },

        async bulkCreate(customers: Customer[]): Promise<string[]> {
            try {
                const records = customers.map(c => ({
                    name: c.name,
                    city: c.city,
                    state: c.state,
                    country: c.country,
                    annual_turnover: c.annualTurnover,
                    project_turnover: c.projectTurnover,
                    industry: c.industry,
                    status: c.status,
                    updated_at: new Date().toISOString()
                }));

                const { data, error } = await _safeInsert('customers', records, false);

                if (error) {
                    console.error("Customers bulkCreate error:", error);
                    throw error;
                }
                return (data || []).map(row => row.id);
            } catch (err: any) {
                console.error("Critical failure in customers.bulkCreate:", err);
                throw err;
            }
        },

        async bulkDelete(ids: string[]): Promise<void> {
            if (!ids || ids.length === 0) return;

            // Filter to only valid UUIDs (Supabase uses UUID format)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validIds = ids.filter(id => id && typeof id === 'string' && uuidRegex.test(id));

            if (validIds.length === 0) {
                console.warn("No valid UUIDs found in customer IDs to delete:", ids);
                return;
            }

            console.log(`Deleting ${validIds.length} customers (filtered from ${ids.length} total IDs)`);

            // Delete related records first to avoid foreign key constraint errors
            try {
                // Delete related contacts
                const { error: contactsError } = await supabase.from('contacts').delete().in('customer_id', validIds);
                if (contactsError) console.warn("Error deleting contacts:", contactsError);

                // Delete related pricing history
                const { error: pricingError } = await supabase.from('pricing_history').delete().in('customer_id', validIds);
                if (pricingError) console.warn("Error deleting pricing_history:", pricingError);
            } catch (err) {
                console.warn("Error cleaning up related records:", err);
            }

            // Now delete the customers
            const { error } = await supabase.from('customers').delete().in('id', validIds);
            if (error) throw error;
        }
    },

    expos: {
        async fetchAll(): Promise<Expo[]> {
            try {
                const { data, error } = await supabase.from('expos').select('*');
                if (error) {
                    console.error("Supabase expos fetch error:", error);
                    throw error;
                }
                return (data || []).map(row => ({
                    id: row.id,
                    name: row.name,
                    date: row.date,
                    location: row.location,
                    industry: row.industry,
                    region: row.region,
                    link: row.link,
                    eventType: row.event_type,
                    organizerName: row.organizer_name,
                    website: row.website,
                    startDate: row.start_date,
                    endDate: row.end_date,
                    city: row.city,
                    state: row.state,
                    venue: row.venue,
                    zone: row.zone,
                    participationType: row.participation_type,
                    stallNo: row.stall_no,
                    boothSize: row.booth_size,
                    feeCost: row.fee_cost,
                    registrationStatus: row.registration_status,
                    assignedTeam: row.assigned_team,
                    visitPlan: row.visit_plan,
                    transportMode: row.transport_mode,
                    hotelDetails: row.hotel_details,
                    budget: row.budget,
                    status: row.status,
                    leadsGenerated: row.leads_generated,
                    hotLeads: row.hot_leads,
                    warmLeads: row.warm_leads,
                    coldLeads: row.cold_leads,
                    ordersReceived: row.orders_received,
                    pipeLineInquiries: row.pipeline_inquiries,
                    newContacts: row.new_contacts,
                    brochureLink: row.brochure_link,
                    entryPassLink: row.entry_pass_link,
                    stallLayoutLink: row.stall_layout_link,
                    photosLink: row.photos_link,
                    visitorListLink: row.visitor_list_link
                }));
            } catch (err) {
                console.error("Critical failure in expos.fetchAll:", err);
                return [];
            }
        },
        async create(expo: Expo): Promise<Expo> {
            const insertData = {
                name: expo.name,
                date: (expo.date || '').trim() || null,
                location: expo.location,
                industry: expo.industry,
                region: expo.region,
                link: expo.link || null,
                event_type: expo.eventType,
                organizer_name: expo.organizerName || null,
                website: expo.website || null,
                start_date: expo.startDate || null,
                end_date: expo.endDate || null,
                city: expo.city || null,
                state: expo.state || null,
                venue: expo.venue || null,
                zone: expo.zone || null,
                participation_type: expo.participationType,
                stall_no: expo.stallNo || null,
                booth_size: expo.boothSize || null,
                fee_cost: expo.feeCost ?? 0,
                registration_status: expo.registrationStatus,
                assigned_team: expo.assignedTeam || null,
                visit_plan: expo.visitPlan || null,
                transport_mode: expo.transportMode || null,
                hotel_details: expo.hotelDetails || null,
                budget: expo.budget ?? 0,
                status: expo.status,
                leads_generated: expo.leadsGenerated ?? 0,
                hot_leads: expo.hotLeads ?? 0,
                warm_leads: expo.warmLeads ?? 0,
                cold_leads: expo.coldLeads ?? 0,
                orders_received: expo.ordersReceived ?? 0,
                pipeline_inquiries: expo.pipeLineInquiries ?? 0,
                new_contacts: expo.newContacts ?? 0,
                brochure_link: expo.brochureLink || null,
                entry_pass_link: expo.entryPassLink || null,
                stall_layout_link: expo.stallLayoutLink || null,
                photos_link: expo.photosLink || null,
                visitor_list_link: expo.visitorListLink || null
            };
            const { data, error } = await _safeInsert('expos', insertData, true);

            if (error) throw error;

            // Map the snake_case data back to camelCase Expo object
            return {
                id: data.id,
                name: data.name,
                date: data.date,
                location: data.location,
                industry: data.industry,
                region: data.region,
                link: data.link,
                eventType: data.event_type,
                organizerName: data.organizer_name,
                website: data.website,
                startDate: data.start_date,
                endDate: data.end_date,
                city: data.city,
                state: data.state,
                venue: data.venue,
                zone: data.zone,
                participationType: data.participation_type,
                stallNo: data.stall_no,
                boothSize: data.booth_size,
                feeCost: data.fee_cost,
                registrationStatus: data.registration_status,
                assignedTeam: data.assigned_team,
                visitPlan: data.visit_plan,
                transportMode: data.transport_mode,
                hotelDetails: data.hotel_details,
                budget: data.budget,
                status: data.status,
                leadsGenerated: data.leads_generated,
                hotLeads: data.hot_leads,
                warmLeads: data.warm_leads,
                coldLeads: data.cold_leads,
                ordersReceived: data.orders_received,
                pipeLineInquiries: data.pipeline_inquiries,
                newContacts: data.new_contacts,
                brochureLink: data.brochure_link,
                entryPassLink: data.entry_pass_link,
                stallLayoutLink: data.stall_layout_link,
                photosLink: data.photos_link,
                visitorListLink: data.visitor_list_link
            };
        },
        async update(id: string, expo: Partial<Expo>): Promise<void> {
            // ... (rest of update remains as is)
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('expos').delete().eq('id', id);
            if (error) throw error;
        },

        async bulkCreate(expos: Expo[]): Promise<string[]> {
            const records = expos.map(expo => ({
                name: expo.name,
                date: (expo.date || '').trim() || null,
                location: expo.location,
                industry: expo.industry,
                region: expo.region,
                status: expo.status
            }));
            const { data, error } = await _safeInsert('expos', records, false);
            if (error) throw error;
            return (data || []).map(row => row.id);
        },

        async bulkDelete(ids: string[]): Promise<void> {
            if (!ids || ids.length === 0) return;

            // Filter to only valid UUIDs
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validIds = ids.filter(id => id && typeof id === 'string' && uuidRegex.test(id));

            if (validIds.length === 0) {
                console.warn("No valid UUIDs found in expo IDs to delete:", ids);
                return;
            }

            const { error } = await supabase.from('expos').delete().in('id', validIds);
            if (error) throw error;
        }
    },

    visits: {
        async fetchAll(): Promise<Visit[]> {
            try {
                const { data, error } = await supabase.from('visits').select('*');
                if (error) {
                    console.error("Supabase visits fetch error:", error);
                    throw error;
                }

                return (data || []).map((v: any) => ({
                    id: v.id,
                    customerId: v.customer_id,
                    customerName: v.customer_name,
                    date: v.date,
                    purpose: v.purpose,
                    assignedTo: v.assigned_to,
                    status: v.status,
                    notes: v.notes,
                    location: v.location,
                    reminderEnabled: v.reminder_enabled
                }));
            } catch (err) {
                console.error("Critical failure in visits.fetchAll:", err);
                return [];
            }
        },
        async create(visit: Visit): Promise<Visit> {
            const insertData = {
                customer_id: visit.customerId,
                customer_name: visit.customerName,
                date: visit.date,
                purpose: visit.purpose,
                assigned_to: visit.assignedTo,
                status: visit.status,
                notes: visit.notes,
                location: visit.location,
                reminder_enabled: visit.reminderEnabled
            };
            const { data, error } = await _safeInsert('visits', insertData, true);

            if (error) throw error;
            return { ...visit, id: data.id };
        },
        async update(visit: Visit): Promise<void> {
            await supabase.from('visits').update({
                customer_id: visit.customerId,
                customer_name: visit.customerName,
                date: visit.date,
                purpose: visit.purpose,
                assigned_to: visit.assignedTo,
                status: visit.status,
                notes: visit.notes,
                location: visit.location,
                reminder_enabled: visit.reminderEnabled
            }).eq('id', visit.id);
        },
        async delete(id: string): Promise<void> {
            await supabase.from('visits').delete().eq('id', id);
        }
    },

    projects: {
        async fetchAll(): Promise<Project[]> {
            try {
                let allProjects: any[] = [];
                let hasMore = true;
                let page = 0;
                const pageSize = 1000;

                while (hasMore) {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('*')
                        .order('updated_at', { ascending: false })
                        .range(page * pageSize, (page + 1) * pageSize - 1);

                    if (error) throw error;

                    if (data) {
                        allProjects = [...allProjects, ...data];
                        if (data.length < pageSize) {
                            hasMore = false;
                        } else {
                            page++;
                        }
                    } else {
                        hasMore = false;
                    }
                }

                const activeProjects = allProjects.filter((p: any) => p.is_deleted !== true);

                return activeProjects.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    startDate: p.start_date,
                    endDate: p.end_date,
                    status: p.status,
                    createdBy: p.created_by,
                    companyName: p.company_name,
                    type: p.project_type || ProjectType.IN_HOUSE,
                    vendorDetails: p.vendor_details,
                    commercialDetails: p.commercial_details,
                    updatedAt: p.updated_at,
                    location: p.location,
                    totalValue: p.total_value
                }));
            } catch (err: any) {
                console.error('Fetch Projects failed:', err);
                return [];
            }
        },
        async create(project: Project): Promise<Project> {
            try {
                const insertData = {
                    name: project.name,
                    description: project.description,
                    start_date: project.startDate,
                    end_date: project.endDate,
                    status: project.status,
                    created_by: project.createdBy,
                    company_name: project.companyName,
                    project_type: project.type,
                    vendor_details: project.vendorDetails,
                    commercial_details: project.commercialDetails,
                    updated_at: new Date().toISOString(),
                    location: project.location,
                    total_value: project.totalValue
                };

                const { data, error } = await _safeInsert('projects', insertData, true);

                if (error) throw error;
                return { ...project, id: data.id };
            } catch (err: any) {
                console.error('Create Project failed:', err);
                throw err;
            }
        },
        async update(project: Project): Promise<void> {
            try {
                const { error } = await supabase.from('projects').update({
                    name: project.name,
                    description: project.description,
                    start_date: project.startDate,
                    end_date: project.endDate,
                    status: project.status,
                    created_by: project.createdBy,
                    company_name: project.companyName,
                    project_type: project.type,
                    vendor_details: project.vendorDetails,
                    commercial_details: project.commercialDetails,
                    updated_at: new Date().toISOString(),
                    location: project.location,
                    total_value: project.totalValue
                }).eq('id', project.id);

                if (error) {
                    if (error.code === '42703') {
                        const { error: fallbackError } = await supabase.from('projects').update({
                            name: project.name,
                            description: project.description,
                            start_date: project.startDate,
                            end_date: project.endDate,
                            status: project.status,
                            created_by: project.createdBy,
                            company_name: project.companyName,
                            updated_at: new Date().toISOString()
                        }).eq('id', project.id);
                        if (fallbackError) throw fallbackError;
                        return;
                    }
                    throw error;
                }
            } catch (err: any) {
                console.error('Update Project failed:', err);
                throw err;
            }
        },
        async delete(id: string): Promise<void> {
            try {
                // Try soft delete first
                const { error } = await supabase.from('projects').update({ is_deleted: true }).eq('id', id);
                if (error) {
                    // Fallback to hard delete
                    const { error: hardError } = await supabase.from('projects').delete().eq('id', id);
                    if (hardError) throw hardError;
                }
            } catch (err: any) {
                console.error('Delete Project failed:', err);
                throw err;
            }
        },

        async bulkCreate(projects: Project[]): Promise<string[]> {
            const records = projects.map(project => ({
                name: project.name,
                description: project.description,
                start_date: project.startDate,
                end_date: project.endDate,
                status: project.status,
                created_by: project.createdBy,
                company_name: project.companyName,
                project_type: project.type,
                updated_at: new Date().toISOString(),
                location: project.location,
                total_value: project.totalValue || 0
            }));
            const { data, error } = await supabase.from('projects').insert(records).select('id');
            if (error) throw error;
            return (data || []).map(row => row.id);
        },

        async bulkDelete(ids: string[]): Promise<void> {
            if (!ids || ids.length === 0) return;

            // Filter to only valid UUIDs
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const validIds = ids.filter(id => id && typeof id === 'string' && uuidRegex.test(id));

            if (validIds.length === 0) {
                console.warn("No valid UUIDs found in project IDs to delete:", ids);
                return;
            }

            const { error } = await supabase.from('projects').delete().in('id', validIds);
            if (error) throw error;
        }
    },
    expenses: {
        async fetchByProject(projectId: string): Promise<Expense[]> {
            const { data, error } = await supabase
                .from('project_expenses')
                .select('*')
                .eq('project_id', projectId)
                .order('date', { ascending: false });

            if (error) throw error;
            return data?.map((e: any) => ({
                id: e.id,
                projectId: e.project_id,
                name: e.name,
                amount: e.amount,
                category: e.category,
                date: e.date,
                paidBy: e.paid_by,
                paymentMode: e.payment_mode,
                billPhoto: e.bill_photo,
                status: e.status,
                rejectionReason: e.rejection_reason,
                notes: e.notes,
                createdAt: e.created_at
            })) || [];
        },
        async create(expense: Partial<Expense>): Promise<Expense> {
            const { data, error } = await supabase.from('project_expenses').insert({
                project_id: expense.projectId,
                name: expense.name,
                amount: expense.amount,
                category: expense.category,
                date: expense.date,
                paid_by: expense.paidBy,
                payment_mode: expense.paymentMode,
                bill_photo: expense.billPhoto,
                status: expense.status,
                notes: expense.notes
            }).select().single();

            if (error) throw error;
            return {
                id: data.id,
                projectId: data.project_id,
                name: data.name,
                amount: data.amount,
                category: data.category,
                date: data.date,
                paidBy: data.paid_by,
                paymentMode: data.payment_mode,
                billPhoto: data.bill_photo,
                status: data.status,
                rejectionReason: data.rejection_reason,
                notes: data.notes,
                createdAt: data.created_at
            };
        },
        async updateStatus(id: string, status: 'Approved' | 'Rejected', reason?: string): Promise<void> {
            const { error } = await supabase
                .from('project_expenses')
                .update({
                    status,
                    rejection_reason: reason
                })
                .eq('id', id);
            if (error) throw error;
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('project_expenses').delete().eq('id', id);
            if (error) throw error;
        }
    },
    income: {
        async fetchByProject(projectId: string): Promise<any[]> {
            const { data, error } = await supabase
                .from('project_incomes')
                .select('*')
                .eq('project_id', projectId)
                .order('received_date', { ascending: false });

            if (error) throw error;
            return data?.map((i: any) => ({
                id: i.id,
                projectId: i.project_id,
                clientName: i.client_name,
                amount: i.amount,
                invoiceNumber: i.invoice_number,
                receivedDate: i.received_date,
                status: i.status,
                mode: i.mode || 'Bank',
                linkedToCommercial: i.linked_to_commercial || false,
                createdAt: i.created_at
            })) || [];
        },
        async create(income: any): Promise<any> {
            const { data, error } = await supabase.from('project_incomes').insert({
                project_id: income.projectId,
                client_name: income.clientName,
                amount: income.amount,
                invoice_number: income.invoiceNumber,
                received_date: income.receivedDate,
                status: income.status,
                mode: income.mode || 'Bank',
                linked_to_commercial: income.linkedToCommercial || false
            }).select().single();

            if (error) throw error;
            return { ...income, id: data.id };
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('project_incomes').delete().eq('id', id);
            if (error) throw error;
        }
    },
    extraExpenses: {
        async fetchByProject(projectId: string): Promise<any[]> {
            const { data, error } = await supabase
                .from('project_extra_expenses')
                .select('*')
                .eq('project_id', projectId)
                .order('date', { ascending: false });

            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }
            return data?.map((e: any) => ({
                id: e.id,
                projectId: e.project_id,
                date: e.date,
                type: e.type,
                amount: e.amount,
                mode: e.mode,
                reference: e.reference,
                remarks: e.remarks,
                addedBy: e.added_by,
                createdAt: e.created_at
            })) || [];
        },
        async create(expense: any): Promise<any> {
            const { data, error } = await supabase.from('project_extra_expenses').insert({
                project_id: expense.projectId,
                date: expense.date,
                type: expense.type,
                amount: expense.amount,
                mode: expense.mode,
                reference: expense.reference,
                remarks: expense.remarks,
                added_by: expense.addedBy
            }).select().single();

            if (error) throw error;
            return { ...expense, id: data.id };
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('project_extra_expenses').delete().eq('id', id);
            if (error) throw error;
        }
    },
    vendors: {
        async fetchAll(): Promise<Vendor[]> {
            try {
                const { data, error } = await supabase
                    .from('vendors')
                    .select('*')
                    .order('name', { ascending: true });

                if (error) {
                    if (error.code === '42P01') return []; // Table doesn't exist yet
                    throw error;
                }
                return data?.map((v: any) => ({
                    id: v.id,
                    name: v.name,
                    type: v.type,
                    contactPerson: v.contact_person,
                    mobile: v.mobile,
                    city: v.city,
                    state: v.state,
                    createdAt: v.created_at
                })) || [];
            } catch (err: any) {
                if (err.code === '42P01') return [];
                throw err;
            }
        },
        async create(vendor: Partial<Vendor>): Promise<Vendor> {
            const { data, error } = await supabase.from('vendors').insert({
                name: vendor.name,
                type: vendor.type,
                contact_person: vendor.contactPerson,
                mobile: vendor.mobile,
                city: vendor.city,
                state: vendor.state
            }).select().single();

            if (error) throw error;
            return {
                id: data.id,
                name: data.name,
                type: data.type,
                contactPerson: data.contact_person,
                mobile: data.mobile,
                city: data.city,
                state: data.state,
                createdAt: data.created_at
            };
        }
    },
    documents: {
        async fetchByProject(projectId: string): Promise<any[]> {
            const { data, error } = await supabase
                .from('project_documents')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') return []; // Table doesn't exist
                throw error;
            }

            return data?.map((d: any) => ({
                id: d.id,
                projectId: d.project_id,
                name: d.name,
                category: d.category,
                tags: d.tags || [],
                fileUrl: d.file_url,
                fileType: d.file_type,
                size: d.size,
                uploadedBy: d.uploaded_by,
                createdAt: d.created_at
            })) || [];
        },
        async create(doc: any): Promise<any> {
            const { data, error } = await supabase.from('project_documents').insert({
                project_id: doc.projectId,
                name: doc.name,
                category: doc.category,
                tags: doc.tags,
                file_url: doc.fileUrl,
                file_type: doc.fileType,
                size: doc.size,
                uploaded_by: doc.uploadedBy
            }).select().single();

            if (error) throw error;
            return {
                id: data.id,
                projectId: data.project_id,
                name: data.name,
                category: data.category,
                tags: data.tags,
                fileUrl: data.file_url,
                fileType: data.file_type,
                size: data.size,
                uploadedBy: data.uploaded_by,
                createdAt: data.created_at
            };
        },
        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('project_documents').delete().eq('id', id);
            if (error) throw error;
        }
    },
    activity: {
        async fetchByProject(projectId: string): Promise<any[]> {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') return [];
                throw error;
            }

            return data?.map((l: any) => ({
                id: l.id,
                projectId: l.project_id,
                type: l.type,
                description: l.description,
                metadata: l.metadata,
                performedBy: l.performed_by,
                createdAt: l.created_at
            })) || [];
        },
        async create(log: any): Promise<void> {
            const { error } = await supabase.from('activity_logs').insert({
                project_id: log.projectId,
                type: log.type,
                description: log.description,
                metadata: log.metadata || {},
                performed_by: log.performedBy
            });
            if (error) throw error;
        }
    },

    pricing: {
        async create(record: PricingRecord): Promise<PricingRecord> {
            const insertData = {
                customer_id: record.customerId,
                tech: record.tech,
                rate: record.rate,
                unit: record.unit,
                date: record.date,
                sales_person: record.salesPerson,
                industry: record.industry,
                city: record.city,
                state: record.state,
                product_name: record.productName,
                drawing_no: record.drawingNo,
                material_type: record.materialType,
                machine_type: record.machineType,
                process: record.process,
                moq: record.moq,
                quoted_qty: record.quotedQty,
                raw_material_cost: record.rawMaterialCost,
                machining_cost: record.machiningCost,
                labor_cost: record.laborCost,
                overhead: record.overhead,
                transportation_cost: record.transportationCost,
                other_charges: record.otherCharges,
                total_amount: record.totalAmount,
                margin_percent: record.marginPercent,
                currency: record.currency,
                valid_till: record.validTill,
                payment_mode: record.paymentMode,
                credit_days: record.creditDays,
                advance_percent: record.advancePercent,
                gst_included: record.gstIncluded,
                status: record.status
            };
            const { data, error } = await _safeInsert('pricing_history', insertData, true);

            if (error) throw error;
            return { ...record, id: data.id };
        },

        async bulkCreate(records: PricingRecord[]): Promise<string[]> {
            const dbRecords = records.map(record => ({
                customer_id: record.customerId,
                tech: record.tech,
                rate: record.rate,
                unit: record.unit,
                date: record.date,
                sales_person: record.salesPerson,
                industry: record.industry,
                city: record.city,
                state: record.state,
                product_name: record.productName,
                drawing_no: record.drawingNo,
                material_type: record.materialType,
                machine_type: record.machineType,
                process: record.process,
                moq: record.moq,
                quoted_qty: record.quotedQty,
                raw_material_cost: record.rawMaterialCost,
                machining_cost: record.machiningCost,
                labor_cost: record.laborCost,
                overhead: record.overhead,
                transportation_cost: record.transportationCost,
                other_charges: record.otherCharges,
                total_amount: record.totalAmount,
                margin_percent: record.marginPercent,
                currency: record.currency,
                valid_till: record.validTill,
                payment_mode: record.paymentMode,
                credit_days: record.creditDays,
                advance_percent: record.advancePercent,
                gst_included: record.gstIncluded,
                status: record.status
            }));
            const { data, error } = await _safeInsert('pricing_history', dbRecords, false);
            if (error) throw error;
            return (data || []).map(row => row.id);
        },

        async update(record: PricingRecord): Promise<void> {
            const { error } = await supabase.from('pricing_history').update({
                tech: record.tech,
                rate: record.rate,
                unit: record.unit,
                date: record.date,
                sales_person: record.salesPerson,
                industry: record.industry,
                city: record.city,
                state: record.state,
                product_name: record.productName,
                drawing_no: record.drawingNo,
                material_type: record.materialType,
                machine_type: record.machineType,
                process: record.process,
                moq: record.moq,
                quoted_qty: record.quotedQty,
                raw_material_cost: record.rawMaterialCost,
                machining_cost: record.machiningCost,
                labor_cost: record.laborCost,
                overhead: record.overhead,
                transportation_cost: record.transportationCost,
                other_charges: record.otherCharges,
                total_amount: record.totalAmount,
                margin_percent: record.marginPercent,
                currency: record.currency,
                valid_till: record.validTill,
                payment_mode: record.paymentMode,
                credit_days: record.creditDays,
                advance_percent: record.advancePercent,
                gst_included: record.gstIncluded,
                status: record.status
            }).eq('id', record.id);

            if (error) throw error;
        },

        async delete(id: string): Promise<void> {
            const { error } = await supabase.from('pricing_history').delete().eq('id', id);
            if (error) throw error;
        }
    },
    storage: {
        async upload(bucket: string, path: string, file: File): Promise<string> {
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(data.path);

            return publicUrl;
        }
    }
};
