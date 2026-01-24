
import React, { useState, useEffect } from 'react';
import { ClipboardList, Archive, FileText, CheckCircle2, User as UserIcon, Building2, Calendar, Clock, X, Plus, LayoutGrid, List as ListIcon, MoreHorizontal, Trash2, Save, Search, FileDown, FileUp, Download, Upload } from 'lucide-react';
import { Project, ProjectStatus, ProjectType, User, Expense, Income, VendorDetails, Vendor, VendorType, CommercialDetails, ClientPayment, VendorPayment } from '../types';
import { api } from '../services/api';
import { dataService } from '../services/dataService';

export const ProjectDetailsView: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCommercialTab, setActiveCommercialTab] = useState<'client' | 'vendor' | 'downloads'>('client');
    const [newClientPayment, setNewClientPayment] = useState<Partial<ClientPayment>>({
        date: new Date().toISOString().split('T')[0],
        mode: 'Bank',
        amount: 0,
        reference: '',
        invoiceNo: '',
        notes: ''
    });
    const [newVendorPayment, setNewVendorPayment] = useState<Partial<VendorPayment>>({
        date: new Date().toISOString().split('T')[0],
        mode: 'Bank',
        amount: 0,
        reference: '',
        voucherNo: '',
        remarks: ''
    });
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loadingVendors, setLoadingVendors] = useState(false);
    const [activeProjectType, setActiveProjectType] = useState<ProjectType>(ProjectType.IN_HOUSE);

    // Stats (calculated from ALL projects, not filtered)
    const stats = {
        total: projects.length,
        active: projects.filter(p => p.status === 'Active').length,
        completed: projects.filter(p => p.status === 'Completed').length,
        onHold: projects.filter(p => p.status === 'On Hold').length
    };

    // Filter Logic
    const filteredProjects = projects.filter(project => {
        const query = searchQuery.toLowerCase();
        const matchesType = (project.type || ProjectType.IN_HOUSE) === activeProjectType;
        const matchesSearch = (
            project.name.toLowerCase().includes(query) ||
            project.description?.toLowerCase().includes(query) ||
            project.status.toLowerCase().includes(query) ||
            project.companyName?.toLowerCase().includes(query)
        );
        return matchesType && matchesSearch;
    });

    // Form State
    const [form, setForm] = useState<{
        name: string;
        description: string;
        startDate: string;
        endDate: string;
        status: ProjectStatus;
        createdBy: string;
        type: ProjectType;
        companyName: string;
        vendorDetails?: VendorDetails;
        commercialDetails?: CommercialDetails;
    }>({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Active',
        createdBy: 'Admin',
        type: ProjectType.IN_HOUSE,
        companyName: '',
        vendorDetails: {
            vendorId: '',
            vendorName: '',
            vendorType: 'CNC',
            vendorContact: '',
            vendorMobile: '',
            vendorCity: '',
            vendorState: '',
            timelineWeeks: 0,
            trackingLink: '',
            milestones: ''
        },
        commercialDetails: {
            client: {
                projectCost: 0,
                advanceReceived: 0,
                balanceReceivable: 0,
                gstAmount: 0,
                gstApplicable: 'No',
                gstNumber: '',
                payments: []
            },
            vendor: {
                totalCost: 0,
                advancePaid: 0,
                balancePayable: 0,
                gstAmount: 0,
                gstApplicable: 'No',
                gstNumber: '',
                paymentTerms: 'Advance',
                payments: []
            },
            marginPercent: 0
        }
    });

    useEffect(() => {
        loadProjects();
        loadVendors();
    }, []);

    const loadVendors = async () => {
        setLoadingVendors(true);
        try {
            const data = await api.vendors.fetchAll();
            setVendors(data);
        } catch (error) {
            console.error('Failed to load vendors', error);
        } finally {
            setLoadingVendors(false);
        }
    };

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await api.projects.fetchAll();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingProject(null);
        setForm({
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'Active',
            createdBy: 'Admin',
            type: activeProjectType,
            companyName: '',
            vendorDetails: {
                vendorId: '',
                vendorName: '',
                vendorType: 'CNC',
                vendorContact: '',
                vendorMobile: '',
                vendorCity: '',
                vendorState: '',
                timelineWeeks: 0,
                trackingLink: '',
                milestones: ''
            },
            commercialDetails: {
                client: {
                    projectCost: 0,
                    advanceReceived: 0,
                    balanceReceivable: 0,
                    gstAmount: 0,
                    gstApplicable: 'No',
                    gstNumber: '',
                    payments: []
                },
                vendor: {
                    totalCost: 0,
                    advancePaid: 0,
                    balancePayable: 0,
                    gstAmount: 0,
                    gstApplicable: 'No',
                    gstNumber: '',
                    paymentTerms: 'Advance',
                    payments: []
                },
                marginPercent: 0
            }
        });
        setShowModal(true);
    };

    const handleOpenEdit = (project: Project) => {
        setEditingProject(project);
        setForm({
            name: project.name,
            description: project.description,
            startDate: project.startDate,
            endDate: project.endDate,
            status: project.status,
            createdBy: project.createdBy,
            type: project.type || ProjectType.IN_HOUSE,
            companyName: project.companyName,
            vendorDetails: project.vendorDetails || {
                vendorId: '',
                vendorName: '',
                vendorType: 'CNC',
                vendorContact: '',
                vendorMobile: '',
                vendorCity: '',
                vendorState: '',
                timelineWeeks: 0,
                trackingLink: '',
                milestones: ''
            },
            commercialDetails: project.commercialDetails?.client ? {
                ...project.commercialDetails,
                client: {
                    ...project.commercialDetails.client,
                    payments: project.commercialDetails.client.payments || []
                },
                vendor: {
                    ...project.commercialDetails.vendor,
                    payments: project.commercialDetails.vendor.payments || []
                }
            } : {
                client: {
                    projectCost: (project.commercialDetails as any)?.clientBillingAmount || 0,
                    advanceReceived: (project.commercialDetails as any)?.advancePaid || 0,
                    balanceReceivable: (project.commercialDetails as any)?.balanceAmount || 0,
                    gstAmount: 0,
                    gstApplicable: (project.commercialDetails as any)?.gstApplicable || 'No',
                    gstNumber: (project.commercialDetails as any)?.gstNumber || '',
                    payments: []
                },
                vendor: {
                    totalCost: (project.commercialDetails as any)?.totalCost || 0,
                    advancePaid: 0,
                    balancePayable: (project.commercialDetails as any)?.totalCost || 0,
                    gstAmount: 0,
                    gstApplicable: 'No',
                    gstNumber: '',
                    paymentTerms: 'Advance',
                    payments: []
                },
                marginPercent: project.commercialDetails?.marginPercent || 0,
                rateType: project.commercialDetails?.rateType
            }
        });
        setShowModal(true);
    };

    const handleAddClientPayment = () => {
        if (!newClientPayment.amount) return;
        const payment: ClientPayment = {
            id: crypto.randomUUID(),
            date: newClientPayment.date || '',
            amount: newClientPayment.amount || 0,
            mode: newClientPayment.mode as any,
            reference: newClientPayment.reference || '',
            invoiceNo: newClientPayment.invoiceNo || '',
            addedBy: form.createdBy,
            notes: newClientPayment.notes || ''
        };

        const updatedPayments = [...(form.commercialDetails?.client?.payments || []), payment];
        const totalAdvance = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const projectCost = form.commercialDetails?.client?.projectCost || 0;

        setForm({
            ...form,
            commercialDetails: {
                ...form.commercialDetails!,
                client: {
                    ...form.commercialDetails!.client,
                    payments: updatedPayments,
                    advanceReceived: totalAdvance,
                    balanceReceivable: projectCost - totalAdvance
                }
            }
        });

        setNewClientPayment({
            date: new Date().toISOString().split('T')[0],
            mode: 'Bank',
            amount: 0,
            reference: '',
            invoiceNo: '',
            notes: ''
        });
    };

    const handleAddVendorPayment = () => {
        if (!newVendorPayment.amount) return;
        const payment: VendorPayment = {
            id: crypto.randomUUID(),
            date: newVendorPayment.date || '',
            amount: newVendorPayment.amount || 0,
            mode: newVendorPayment.mode as any,
            reference: newVendorPayment.reference || '',
            voucherNo: newVendorPayment.voucherNo || '',
            paidBy: form.createdBy,
            remarks: newVendorPayment.remarks || ''
        };

        const updatedPayments = [...(form.commercialDetails?.vendor?.payments || []), payment];
        const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalCost = form.commercialDetails?.vendor?.totalCost || 0;

        setForm({
            ...form,
            commercialDetails: {
                ...form.commercialDetails!,
                vendor: {
                    ...form.commercialDetails!.vendor,
                    payments: updatedPayments,
                    advancePaid: totalPaid,
                    balancePayable: totalCost - totalPaid
                }
            }
        });

        setNewVendorPayment({
            date: new Date().toISOString().split('T')[0],
            mode: 'Bank',
            amount: 0,
            reference: '',
            voucherNo: '',
            remarks: ''
        });
    };

    const handleSelectVendor = (vendorId: string) => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (vendor) {
            setForm({
                ...form,
                vendorDetails: {
                    ...form.vendorDetails!,
                    vendorId: vendor.id,
                    vendorName: vendor.name,
                    vendorType: vendor.type,
                    vendorContact: vendor.contactPerson,
                    vendorMobile: vendor.mobile,
                    vendorCity: vendor.city,
                    vendorState: vendor.state
                }
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!form.name) throw new Error("Project Name is mandatory.");

            let finalVendorDetails = form.vendorDetails;

            if (form.type === ProjectType.VENDOR && form.vendorDetails) {
                // Validation
                if (!form.vendorDetails.vendorName) throw new Error("Vendor Name is mandatory.");
                if (!form.vendorDetails.vendorType) throw new Error("Vendor Type is mandatory.");

                // If it's a new vendor (no vendorId), create it in the master list first
                if (!form.vendorDetails.vendorId) {
                    const newMasterVendor = await api.vendors.create({
                        name: form.vendorDetails.vendorName,
                        type: form.vendorDetails.vendorType,
                        contactPerson: form.vendorDetails.vendorContact,
                        mobile: form.vendorDetails.vendorMobile,
                        city: form.vendorDetails.vendorCity,
                        state: form.vendorDetails.vendorState
                    });

                    finalVendorDetails = {
                        ...form.vendorDetails,
                        vendorId: newMasterVendor.id
                    };

                    // Refresh local vendor list
                    loadVendors();
                }
            }

            if (editingProject) {
                // Update
                const updatedProject: Project = {
                    ...editingProject,
                    name: form.name,
                    description: form.description,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    status: form.status,
                    createdBy: form.createdBy,
                    type: form.type,
                    companyName: form.companyName,
                    vendorDetails: form.type === ProjectType.VENDOR ? finalVendorDetails : undefined,
                    commercialDetails: form.type === ProjectType.VENDOR ? form.commercialDetails : undefined
                };
                await api.projects.update(updatedProject);
                setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
            } else {
                // Create
                const newProject: Project = {
                    id: '', // Generated by DB
                    name: form.name,
                    description: form.description,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    status: form.status,
                    createdBy: form.createdBy,
                    type: form.type,
                    companyName: form.companyName,
                    vendorDetails: form.type === ProjectType.VENDOR ? finalVendorDetails : undefined,
                    commercialDetails: form.type === ProjectType.VENDOR ? form.commercialDetails : undefined
                };
                const saved = await api.projects.create(newProject);
                setProjects(prev => [saved, ...prev]);
            }
            setShowModal(false);
        } catch (error: any) {
            if (error.message.includes("Vendor Name") || error.message.includes("Vendor Type") || error.message.includes("Project Name")) {
                setActiveTab('overview');
            }
            alert('Validation Error: ' + error.message);
        }
    };

    const handleDelete = async () => {
        if (!editingProject) return;
        if (!window.confirm("Are you sure you want to delete this project? This action can be undone by an admin.")) return;

        try {
            await api.projects.delete(editingProject.id);
            setProjects(prev => prev.filter(p => p.id !== editingProject.id));
            setShowModal(false);
        } catch (error: any) {
            alert('Failed to delete project: ' + error.message);
        }
    };

    const StatusBadge = ({ status }: { status: ProjectStatus }) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border inline-flex items-center ${status === 'Active' ? 'bg-green-50 text-green-600 border-green-100' :
            status === 'Completed' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${status === 'Active' ? 'bg-green-500' :
                status === 'Completed' ? 'bg-slate-400' :
                    'bg-amber-500'
                }`}></span>
            {status}
        </span>
    );

    // Tab State
    type Tab = 'overview' | 'commercial' | 'direct_expenses' | 'extra_expenses' | 'income' | 'profit_loss' | 'documents' | 'activity';
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    // Expense State
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loadingExpenses, setLoadingExpenses] = useState(false);
    const [expenseForm, setExpenseForm] = useState<{
        name: string;
        amount: string;
        category: Expense['category'];
        date: string;
        paidBy: string;
        status: Expense['status'];
        notes: string;
    }>({
        name: '',
        amount: '',
        category: 'Raw Material',
        date: new Date().toISOString().split('T')[0],
        paidBy: '',
        status: 'Pending',
        notes: ''
    });

    useEffect(() => {
        if (activeTab === 'direct_expenses' && editingProject) {
            loadExpenses(editingProject.id);
        }
        if (activeTab === 'extra_expenses' && editingProject) {
            loadExtraExpenses(editingProject.id);
        }
    }, [activeTab, editingProject]);

    // Extra Expense State
    const [extraExpenses, setExtraExpenses] = useState<any[]>([]);
    const [loadingExtraExpenses, setLoadingExtraExpenses] = useState(false);
    const [extraExpenseForm, setExtraExpenseForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Transport',
        amount: '',
        mode: 'Bank' as 'Cash' | 'Bank' | 'UPI',
        reference: '',
        remarks: ''
    });

    const loadExtraExpenses = async (projectId: string) => {
        setLoadingExtraExpenses(true);
        try {
            const data = await api.extraExpenses.fetchByProject(projectId);
            setExtraExpenses(data);
        } catch (error) {
            console.error('Failed to load extra expenses', error);
        } finally {
            setLoadingExtraExpenses(false);
        }
    };

    const handleSaveExtraExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        try {
            const newExtraExpense = {
                projectId: editingProject.id,
                date: extraExpenseForm.date,
                type: extraExpenseForm.type,
                amount: parseFloat(extraExpenseForm.amount),
                mode: extraExpenseForm.mode,
                reference: extraExpenseForm.reference,
                remarks: extraExpenseForm.remarks,
                addedBy: form.createdBy
            };
            const saved = await api.extraExpenses.create(newExtraExpense);
            setExtraExpenses(prev => [saved, ...prev]);

            setExtraExpenseForm({
                date: new Date().toISOString().split('T')[0],
                type: 'Transport',
                amount: '',
                mode: 'Bank',
                reference: '',
                remarks: ''
            });
        } catch (error: any) {
            alert('Failed to save extra expense: ' + error.message);
        }
    };

    const loadExpenses = async (projectId: string) => {
        setLoadingExpenses(true);
        try {
            const data = await api.expenses.fetchByProject(projectId);
            setExpenses(data);
        } catch (error) {
            console.error('Failed to load expenses', error);
        } finally {
            setLoadingExpenses(false);
        }
    };

    const handleSaveExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        try {
            const newExpense = {
                projectId: editingProject.id,
                name: expenseForm.name,
                amount: parseFloat(expenseForm.amount),
                category: expenseForm.category,
                date: expenseForm.date,
                paidBy: expenseForm.paidBy,
                status: expenseForm.status,
                notes: expenseForm.notes
            };
            const saved = await api.expenses.create(newExpense);
            setExpenses(prev => [saved, ...prev]);

            // Reset form (keep date and paidBy for convenience?)
            setExpenseForm(prev => ({
                ...prev,
                name: '',
                amount: '',
                notes: ''
            }));
        } catch (error: any) {
            alert('Failed to save expense: ' + error.message);
        }
    };

    const handleExportExpensesPDF = () => {
        if (!expenses.length) return alert('No expenses to export');
        const columns = ['Date', 'Item', 'Category', 'Paid By', 'Status', 'Amount'];
        const rows = expenses.map(e => [
            e.date,
            e.name,
            e.category,
            e.paidBy || '-',
            e.status,
            `Rs. ${e.amount}`
        ]);
        dataService.exportPDF(`Expenses_${editingProject?.name}`, columns, rows);
    };

    const handleExportExpensesExcel = () => {
        if (!expenses.length) return alert('No expenses to export');
        const data = expenses.map(e => ({
            Date: e.date,
            Item: e.name,
            Category: e.category,
            'Paid By': e.paidBy,
            Status: e.status,
            Amount: e.amount,
            Notes: e.notes
        }));
        dataService.exportExcel(data, `Expenses_${editingProject?.name}`, 'Expenses');
    };

    const handleImportExpenses = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !editingProject) return;
        const file = e.target.files[0];
        try {
            const data = await dataService.readExcel(file);
            // Expected format check could be here
            let count = 0;
            for (const row of data) {
                // Basic mapping based on column names (adapt as per user's excel structure)
                // Assuming Excel has columns: Item, Amount, Category, Date, Paid By, Status, Notes
                if (!row.Item || !row.Amount) continue;

                await api.expenses.create({
                    projectId: editingProject.id,
                    name: row.Item,
                    amount: parseFloat(row.Amount),
                    category: row.Category || 'Other',
                    date: row.Date || new Date().toISOString().split('T')[0],
                    paidBy: row['Paid By'] || '',
                    status: row.Status || 'Pending',
                    notes: row.Notes || ''
                });
                count++;
            }
            alert(`Successfully imported ${count} expenses!`);
            loadExpenses(editingProject.id); // Reload
        } catch (error: any) {
            alert('Import failed: ' + error.message);
        }
        e.target.value = ''; // Reset input
    };

    // Income State
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [loadingIncomes, setLoadingIncomes] = useState(false);
    const [incomeForm, setIncomeForm] = useState<{
        clientName: string;
        amount: string;
        invoiceNumber: string;
        receivedDate: string;
        status: Income['status'];
    }>({
        clientName: '',
        amount: '',
        invoiceNumber: '',
        receivedDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
    });

    useEffect(() => {
        if (activeTab === 'income' && editingProject) {
            loadIncomes(editingProject.id);
        }
    }, [activeTab, editingProject]);

    // Load both for Profit & Loss
    useEffect(() => {
        if (activeTab === 'profit_loss' && editingProject) {
            loadExpenses(editingProject.id);
            loadIncomes(editingProject.id);
        }
    }, [activeTab, editingProject]);

    const loadIncomes = async (projectId: string) => {
        setLoadingIncomes(true);
        try {
            const data = await api.income.fetchByProject(projectId);
            setIncomes(data);
        } catch (error) {
            console.error('Failed to load income', error);
        } finally {
            setLoadingIncomes(false);
        }
    };

    const handleSaveIncome = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        try {
            const newIncome = {
                projectId: editingProject.id,
                clientName: incomeForm.clientName,
                amount: parseFloat(incomeForm.amount),
                invoiceNumber: incomeForm.invoiceNumber,
                receivedDate: incomeForm.receivedDate,
                status: incomeForm.status
            };
            const saved = await api.income.create(newIncome);
            setIncomes(prev => [saved, ...prev]);

            setIncomeForm(prev => ({
                ...prev,
                amount: '',
                invoiceNumber: ''
            }));
        } catch (error: any) {
            alert('Failed to save income: ' + error.message);
        }
    };

    const handleExportIncomePDF = () => {
        if (!incomes.length) return alert('No income records to export');
        const columns = ['Date', 'Client', 'Invoice #', 'Status', 'Amount'];
        const rows = incomes.map(i => [
            i.receivedDate,
            i.clientName,
            i.invoiceNumber || '-',
            i.status,
            `Rs. ${i.amount}`
        ]);
        dataService.exportPDF(`Income_${editingProject?.name}`, columns, rows);
    };

    const handleExportIncomeExcel = () => {
        if (!incomes.length) return alert('No income records to export');
        const data = incomes.map(i => ({
            Date: i.receivedDate,
            Client: i.clientName,
            'Invoice #': i.invoiceNumber,
            Status: i.status,
            Amount: i.amount
        }));
        dataService.exportExcel(data, `Income_${editingProject?.name}`, 'Income');
    };

    const handleExportProjectPDF = () => {
        if (!editingProject) return;
        const columns = ['Field', 'Details'];
        const rows = [
            ['Project Name', editingProject.name],
            ['Description', editingProject.description || 'N/A'],
            ['Start Date', editingProject.startDate || 'N/A'],
            ['End Date', editingProject.endDate || 'N/A'],
            ['Status', editingProject.status],
            ['Created By', editingProject.createdBy],
            ['Company/Client', editingProject.companyName || 'N/A'],
        ];

        if (editingProject.type === ProjectType.VENDOR && editingProject.vendorDetails) {
            rows.push(['---', '---']);
            rows.push(['[ Vendor Details ]', '']);
            rows.push(['Vendor Name', editingProject.vendorDetails.vendorName]);
            rows.push(['Vendor Contact', editingProject.vendorDetails.vendorContact]);
            rows.push(['Timeline', `${editingProject.vendorDetails.timelineWeeks} Weeks`]);
        }

        if (editingProject.type === ProjectType.VENDOR && editingProject.commercialDetails) {
            rows.push(['---', '---']);
            rows.push(['[ Commercial Details ]', '']);
            rows.push(['Margin %', `${editingProject.commercialDetails.marginPercent}%`]);
            rows.push(['---', 'Client Income']);
            rows.push(['Client Project Cost', `Rs. ${editingProject.commercialDetails.client?.projectCost || 0}`]);
            rows.push(['Advance Received', `Rs. ${editingProject.commercialDetails.client?.advanceReceived || 0}`]);
            rows.push(['Balance Receivable', `Rs. ${editingProject.commercialDetails.client?.balanceReceivable || 0}`]);
            rows.push(['Client GST Amount', `Rs. ${editingProject.commercialDetails.client?.gstAmount || 0}`]);
            rows.push(['---', 'Vendor Expenditure']);
            rows.push(['Vendor Total Cost', `Rs. ${editingProject.commercialDetails.vendor?.totalCost || 0}`]);
            rows.push(['Vendor Advance Paid', `Rs. ${editingProject.commercialDetails.vendor?.advancePaid || 0}`]);
            rows.push(['Vendor Balance Payable', `Rs. ${editingProject.commercialDetails.vendor?.balancePayable || 0}`]);
            rows.push(['Vendor GST Amount', `Rs. ${editingProject.commercialDetails.vendor?.gstAmount || 0}`]);
            rows.push(['Payment Terms', editingProject.commercialDetails.vendor?.paymentTerms || 'N/A']);
        }

        dataService.exportPDF(`Project_Report_${editingProject.name}`, columns, rows);
    };

    const handleExportProjectExcel = () => {
        if (!editingProject) return;
        const data = {
            'Project Name': editingProject.name,
            'Description': editingProject.description,
            'Start Date': editingProject.startDate,
            'End Date': editingProject.endDate,
            'Status': editingProject.status,
            'Created By': editingProject.createdBy,
            'Company/Client': editingProject.companyName,
            ...(editingProject.type === ProjectType.VENDOR ? {
                'Vendor Name': editingProject.vendorDetails?.vendorName,
                'Vendor Contact': editingProject.vendorDetails?.vendorContact,
                'Timeline (Weeks)': editingProject.vendorDetails?.timelineWeeks,
                'Margin %': editingProject.commercialDetails?.marginPercent,
                'Client Project Cost': editingProject.commercialDetails?.client?.projectCost,
                'Client Advance Received': editingProject.commercialDetails?.client?.advanceReceived,
                'Client Balance Receivable': editingProject.commercialDetails?.client?.balanceReceivable,
                'Vendor Total Cost': editingProject.commercialDetails?.vendor?.totalCost,
                'Vendor Advance Paid': editingProject.commercialDetails?.vendor?.advancePaid,
                'Vendor Balance Payable': editingProject.commercialDetails?.vendor?.balancePayable,
                'Vendor Payment Terms': editingProject.commercialDetails?.vendor?.paymentTerms
            } : {})
        };
        dataService.exportExcel([data], `Project_Report_${editingProject.name}`, 'Overview');
    };

    const handleExportClientLedgerPDF = () => {
        if (!editingProject || !form.commercialDetails?.client?.payments) return;
        const columns = ['Date', 'Invoice #', 'Mode', 'Amount', 'Reference', 'Added By'];
        const rows = form.commercialDetails.client.payments.map(p => [
            p.date,
            p.invoiceNo || '-',
            p.mode,
            `₹${p.amount.toLocaleString()}`,
            p.reference || '-',
            p.addedBy
        ]);
        dataService.exportPDF(`Client_Ledger_${editingProject.name}`, columns, rows);
    };

    const handleExportVendorLedgerPDF = () => {
        if (!editingProject || !form.commercialDetails?.vendor?.payments) return;
        const columns = ['Date', 'Voucher #', 'Mode', 'Amount', 'Reference', 'Paid By'];
        const rows = form.commercialDetails.vendor.payments.map(p => [
            p.date,
            p.voucherNo || '-',
            p.mode,
            `₹${p.amount.toLocaleString()}`,
            p.reference || '-',
            p.paidBy
        ]);
        dataService.exportPDF(`Vendor_Ledger_${editingProject.name}`, columns, rows);
    };

    const handleExportFullProjectLedgerExcel = () => {
        if (!editingProject) return;
        const clientPayments = form.commercialDetails?.client?.payments?.map(p => ({
            Type: 'Client Receipt',
            Date: p.date,
            'Doc #': p.invoiceNo,
            Amount: p.amount,
            Mode: p.mode,
            Reference: p.reference,
            'By/To': p.addedBy
        })) || [];

        const vendorPayments = form.commercialDetails?.vendor?.payments?.map(p => ({
            Type: 'Vendor Payment',
            Date: p.date,
            'Doc #': p.voucherNo,
            Amount: p.amount,
            Mode: p.mode,
            Reference: p.reference,
            'By/To': p.paidBy
        })) || [];

        const allPayments = [...clientPayments, ...vendorPayments].sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
        dataService.exportExcel(allPayments, `Full_Ledger_${editingProject.name}`, 'Transactions');
    };

    const handleImportIncome = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length || !editingProject) return;
        const file = e.target.files[0];
        try {
            const data = await dataService.readExcel(file);
            let count = 0;
            for (const row of data) {
                // Assuming columns: Client, Amount, Invoice, Date, Status
                if (!row.Client || !row.Amount) continue;

                await api.income.create({
                    projectId: editingProject.id,
                    clientName: row.Client,
                    amount: parseFloat(row.Amount),
                    invoiceNumber: row.Invoice || '',
                    receivedDate: row.Date || new Date().toISOString().split('T')[0],
                    status: row.Status || 'Pending'
                });
                count++;
            }
            alert(`Successfully imported ${count} income records!`);
            loadIncomes(editingProject.id); // Reload
        } catch (error: any) {
            alert('Import failed: ' + error.message);
        }
        e.target.value = '';
    };

    // Icons for tabs
    const TabButton = ({ id, label, icon: Icon, className, tooltip }: { id: Tab, label: string, icon: any, className?: string, tooltip?: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            title={tooltip}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl w-full text-sm font-bold transition-all ${activeTab === id
                ? 'bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                } ${className || ''}`}
        >
            <Icon size={18} />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Project Management</h2>
                    <p className="text-slate-500 font-medium">Overview of active engineering projects.</p>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">

                    {/* Search Bar - Moved to right side for cleaner layout next to controls */}
                    <div className="relative group w-full md:w-64 lg:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search projects by name, company..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm w-full transition-all"
                        />
                    </div>

                    <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center px-6 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 text-sm font-bold transition-all shadow-xl shadow-slate-500/20 active:scale-95 shrink-0"
                    >
                        <Plus size={18} className="mr-3 text-blue-400" /> New Project
                    </button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Projects', value: stats.total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active', value: stats.active, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'On Hold', value: stats.onHold, icon: Archive, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                        </div>
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Project Type Tabs */}
            <div className="flex items-center space-x-2 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200 w-fit">
                <button
                    onClick={() => setActiveProjectType(ProjectType.IN_HOUSE)}
                    className={`flex items-center space-x-3 px-8 py-3.5 rounded-xl text-sm font-black transition-all ${activeProjectType === ProjectType.IN_HOUSE
                        ? 'bg-white text-blue-600 shadow-md ring-1 ring-slate-200'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <LayoutGrid size={18} />
                    <span>In-House Projects</span>
                </button>
                <button
                    onClick={() => setActiveProjectType(ProjectType.VENDOR)}
                    className={`flex items-center space-x-3 px-8 py-3.5 rounded-xl text-sm font-black transition-all ${activeProjectType === ProjectType.VENDOR
                        ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200'
                        : 'text-slate-400 hover:text-slate-600'
                        }`}
                >
                    <Building2 size={18} />
                    <span>Vendor Projects</span>
                </button>
            </div>

            {/* Content Switcher */}
            {loading ? (
                <div className="p-12 text-center text-slate-400">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                        <FileText size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">No Projects Found</h3>
                    <p className="text-slate-400 text-sm mt-1">
                        {searchQuery ? `No matches for "${searchQuery}"` : "Initialize a new project using the button above."}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => handleOpenEdit(project)}
                            className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-bl-[2rem] -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>

                            <div className="relative">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                                        <ClipboardList size={28} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <StatusBadge status={project.status} />
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${project.type === ProjectType.VENDOR ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {project.type || ProjectType.IN_HOUSE}
                                        </span>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-slate-900 mb-2 truncate" title={project.name}>{project.name}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 h-10">
                                    {project.description || 'No description provided.'}
                                </p>

                                <div className="space-y-3 pt-6 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                                        <div className="flex items-center">
                                            <Building2 size={14} className="mr-2 text-slate-300" />
                                            <span className="uppercase tracking-wider truncate">{project.companyName || 'Unknown Company'}</span>
                                        </div>
                                        {project.type === ProjectType.VENDOR && project.vendorDetails?.vendorName && (
                                            <span className="text-[9px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 truncate max-w-[120px]">
                                                {project.vendorDetails.vendorName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-xs font-bold text-slate-400">
                                            <Calendar size={14} className="mr-2 text-slate-300" />
                                            <span>{project.startDate || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center text-xs font-bold text-slate-400">
                                            <UserIcon size={14} className="mr-2 text-slate-300" />
                                            <span>{project.createdBy}</span>
                                        </div>
                                    </div>

                                    {project.type === ProjectType.VENDOR && (
                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-50">
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Billing</p>
                                                <p className="text-xs font-black text-slate-900">₹{project.commercialDetails?.client?.projectCost || 0}</p>
                                            </div>
                                            <div className="bg-slate-50 p-2 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Margin</p>
                                                <p className={`text-xs font-black ${project.commercialDetails?.marginPercent && project.commercialDetails.marginPercent > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {project.commercialDetails?.marginPercent || 0}%
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Project Name</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Financials</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProjects.map((project) => (
                                <tr
                                    key={project.id}
                                    onClick={() => handleOpenEdit(project)}
                                    className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mr-4 font-bold">
                                                {project.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{project.name}</p>
                                                <p className="text-xs text-slate-400 truncate max-w-[200px]">{project.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center text-sm font-medium text-slate-600">
                                            <Building2 size={16} className="mr-2 text-slate-400" />
                                            {project.companyName || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-medium text-slate-500">
                                        <div className="flex flex-col mb-1 text-slate-700">
                                            <span className="flex items-center mb-1"><Calendar size={12} className="mr-1.5 text-slate-300" /> Start: {project.startDate || 'N/A'}</span>
                                            <span className="flex items-center"><Clock size={12} className="mr-1.5 text-slate-300" /> End: {project.endDate || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${project.type === ProjectType.VENDOR ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {project.type || ProjectType.IN_HOUSE}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">
                                        {project.type === ProjectType.VENDOR ? (
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-slate-900 leading-none mb-1">₹{project.commercialDetails?.client?.projectCost || 0}</span>
                                                <span className={`text-[9px] font-black ${project.commercialDetails?.marginPercent && project.commercialDetails.marginPercent > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {project.commercialDetails?.marginPercent || 0}% Margin
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-300 font-bold">N/A</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <StatusBadge status={project.status} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg inline-block">
                                            <UserIcon size={12} className="mr-1.5" />
                                            {project.createdBy}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <button className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Expanded Modal for Detail View */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex">

                        {/* Sidebar */}
                        <div className="w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col hidden md:flex">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-slate-900">{editingProject ? 'Edit Project' : 'New Project'}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Workspace</p>
                            </div>

                            <nav className="space-y-2 flex-1">
                                <TabButton id="overview" label="Overview" icon={LayoutGrid} />
                                {form.type === ProjectType.VENDOR && <TabButton id="commercial" label="Commercial Details" icon={Archive} />}
                                <TabButton id="direct_expenses" label="Direct Expenses" icon={ClipboardList} />
                                <TabButton
                                    id="extra_expenses"
                                    label="Extra Expenses"
                                    icon={ClipboardList}
                                    className="text-amber-500 hover:bg-amber-50"
                                    tooltip="These expenses are borne by company"
                                />
                                <TabButton id="income" label="Income" icon={CheckCircle2} />
                                <TabButton id="profit_loss" label="Profit & Loss" icon={Archive} />
                                <TabButton id="documents" label="Documents" icon={FileText} />
                                <TabButton id="activity" label="Activity Log" icon={Clock} />
                            </nav>

                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-xl w-full text-sm font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                                >
                                    <X size={18} />
                                    <span>Close</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col h-full bg-white relative">
                            {/* Mobile Header (visible only on small screens) */}
                            <div className="md:hidden px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="font-black text-slate-900">Project Details</h3>
                                <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
                            </div>

                            {/* Mobile Tabs (horizontal scroll) */}
                            <div className="md:hidden flex overflow-x-auto p-4 space-x-2 border-b border-slate-100 no-scrollbar">
                                {['overview', 'direct_expenses', 'extra_expenses', 'income', 'profit_loss', 'documents', 'activity'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t as Tab)}
                                        className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider ${activeTab === t ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}
                                    >
                                        {t.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 md:p-12">
                                {activeTab === 'overview' && (
                                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">Project Overview</h2>
                                                <p className="text-slate-500">Manage core project details and status.</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={handleExportProjectExcel}
                                                    className="flex items-center px-4 py-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 text-xs font-black transition-all border border-green-100"
                                                    title="Export to Excel"
                                                >
                                                    <Download size={14} className="mr-2" /> XL
                                                </button>
                                                <button
                                                    onClick={handleExportProjectPDF}
                                                    className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 text-xs font-black transition-all border border-red-100"
                                                    title="Export to PDF"
                                                >
                                                    <FileDown size={14} className="mr-2" /> PDF
                                                </button>
                                            </div>
                                        </div>

                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Project Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                                                    placeholder="Enter project title..."
                                                    value={form.name}
                                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                                />
                                            </div>

                                            {form.type === ProjectType.VENDOR && (
                                                <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white space-y-8 animate-in zoom-in-95 duration-300 border border-white/5 shadow-2xl">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Vendor Master Selection</h4>
                                                            <p className="text-white/40 text-[10px] font-bold">Pick an existing vendor or enter details for a new one.</p>
                                                        </div>
                                                        <Building2 className="text-blue-500/20" size={32} />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Vendor</label>
                                                                <select
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                                                    value={form.vendorDetails?.vendorId || ''}
                                                                    onChange={e => handleSelectVendor(e.target.value)}
                                                                >
                                                                    <option value="" className="bg-slate-900 text-slate-400 font-bold">--- Select Master Vendor ---</option>
                                                                    {vendors.map(v => (
                                                                        <option key={v.id} value={v.id} className="bg-slate-900 text-white font-bold">{v.name} ({v.type})</option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor Name (Required)</label>
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                                                                    placeholder="e.g. Precision Components Ltd"
                                                                    value={form.vendorDetails?.vendorName || ''}
                                                                    onChange={e => setForm({
                                                                        ...form,
                                                                        vendorDetails: { ...form.vendorDetails!, vendorName: e.target.value }
                                                                    })}
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vendor Type (Mandatory)</label>
                                                                <select
                                                                    required
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                                                    value={form.vendorDetails?.vendorType || 'CNC'}
                                                                    onChange={e => setForm({
                                                                        ...form,
                                                                        vendorDetails: { ...form.vendorDetails!, vendorType: e.target.value as VendorType }
                                                                    })}
                                                                >
                                                                    <option value="CNC" className="bg-slate-900">CNC</option>
                                                                    <option value="Fabrication" className="bg-slate-900">Fabrication</option>
                                                                    <option value="Casting" className="bg-slate-900">Casting</option>
                                                                    <option value="Painting" className="bg-slate-900">Painting</option>
                                                                    <option value="Electrical" className="bg-slate-900">Electrical</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact Person</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                                                                        placeholder="Name"
                                                                        value={form.vendorDetails?.vendorContact || ''}
                                                                        onChange={e => setForm({
                                                                            ...form,
                                                                            vendorDetails: { ...form.vendorDetails!, vendorContact: e.target.value }
                                                                        })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mobile Number</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                                                                        placeholder="Phone"
                                                                        value={form.vendorDetails?.vendorMobile || ''}
                                                                        onChange={e => setForm({
                                                                            ...form,
                                                                            vendorDetails: { ...form.vendorDetails!, vendorMobile: e.target.value }
                                                                        })}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                                                                        placeholder="City"
                                                                        value={form.vendorDetails?.vendorCity || ''}
                                                                        onChange={e => setForm({
                                                                            ...form,
                                                                            vendorDetails: { ...form.vendorDetails!, vendorCity: e.target.value }
                                                                        })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">State</label>
                                                                    <input
                                                                        type="text"
                                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                                                                        placeholder="State"
                                                                        value={form.vendorDetails?.vendorState || ''}
                                                                        onChange={e => setForm({
                                                                            ...form,
                                                                            vendorDetails: { ...form.vendorDetails!, vendorState: e.target.value }
                                                                        })}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="pt-4 border-t border-white/5 mt-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Timeline (Weeks)</label>
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all placeholder:text-white/10"
                                                                        placeholder="Weeks"
                                                                        value={form.vendorDetails?.timelineWeeks || ''}
                                                                        onChange={e => setForm({
                                                                            ...form,
                                                                            vendorDetails: { ...form.vendorDetails!, timelineWeeks: parseInt(e.target.value) || 0 }
                                                                        })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                                                <textarea
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300 resize-none h-32"
                                                    placeholder="Brief project summary..."
                                                    value={form.description}
                                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                        value={form.startDate}
                                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                        value={form.endDate}
                                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                                                    <select
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                        value={form.status}
                                                        onChange={e => setForm({ ...form, status: e.target.value as ProjectStatus })}
                                                    >
                                                        <option value="Active">Active</option>
                                                        <option value="Completed">Completed</option>
                                                        <option value="On Hold">On Hold</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Created By</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                        value={form.createdBy}
                                                        onChange={e => setForm({ ...form, createdBy: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name / Client</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-300"
                                                    placeholder="Client Company..."
                                                    value={form.companyName}
                                                    onChange={e => setForm({ ...form, companyName: e.target.value })}
                                                />
                                            </div>

                                            <div className="flex items-center space-x-3 mt-12 pt-6 border-t border-slate-100">
                                                {editingProject && (
                                                    <button
                                                        type="button"
                                                        onClick={handleDelete}
                                                        className="px-6 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center"
                                                >
                                                    <Save size={18} className="mr-2" />
                                                    {editingProject ? 'Update Project Details' : 'Create Project'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {activeTab === 'commercial' && form.type === ProjectType.VENDOR && (
                                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">Commercial Layers</h2>
                                                <p className="text-slate-500 text-sm">Manage Client Billing and Vendor Expenditure.</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                                <Archive size={24} />
                                            </div>
                                        </div>

                                        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-blue-500/10"></div>

                                            <div className="relative space-y-12">
                                                {/* SUB-TABS NAVIGATION */}
                                                <div className="flex space-x-2 p-1 bg-white/5 rounded-2xl border border-white/5 mb-8">
                                                    {(['client', 'vendor', 'downloads'] as const).map(tab => (
                                                        <button
                                                            key={tab}
                                                            type="button"
                                                            onClick={() => setActiveCommercialTab(tab)}
                                                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCommercialTab === tab
                                                                ? 'bg-blue-600 text-white shadow-lg'
                                                                : 'text-slate-400 hover:bg-white/5'}`}
                                                        >
                                                            {tab === 'client' ? 'Client Payments' : tab === 'vendor' ? 'Vendor Payments' : 'Downloads'}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* SUB-TAB CONTENT */}
                                                {activeCommercialTab === 'client' && (
                                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Client Payment Ledger</h4>
                                                            <div className="flex gap-4">
                                                                <div className="text-right">
                                                                    <p className="text-[8px] font-black text-slate-500 uppercase">Received</p>
                                                                    <p className="text-sm font-black text-emerald-400">₹{(form.commercialDetails?.client?.advanceReceived || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[8px] font-black text-slate-500 uppercase">Pending</p>
                                                                    <p className="text-sm font-black text-amber-400">₹{(form.commercialDetails?.client?.balanceReceivable || 0).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ADD PAYMENT FORM */}
                                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Date</label>
                                                                    <input type="date" className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newClientPayment.date || ''} onChange={e => setNewClientPayment({ ...newClientPayment, date: e.target.value })} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Amount</label>
                                                                    <input type="number" placeholder="₹ 0.00" className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newClientPayment.amount || ''} onChange={e => setNewClientPayment({ ...newClientPayment, amount: parseFloat(e.target.value) || 0 })} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Mode</label>
                                                                    <select className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newClientPayment.mode} onChange={e => setNewClientPayment({ ...newClientPayment, mode: e.target.value as any })}>
                                                                        <option value="Bank">Bank</option>
                                                                        <option value="Cash">Cash</option>
                                                                        <option value="UPI">UPI</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Invoice # (Opt)</label>
                                                                    <input type="text" placeholder="INV-000" className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newClientPayment.invoiceNo || ''} onChange={e => setNewClientPayment({ ...newClientPayment, invoiceNo: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-4 items-end">
                                                                <div className="flex-1">
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Reference / Notes</label>
                                                                    <input type="text" placeholder="UTR / Transaction Details..." className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newClientPayment.reference || ''} onChange={e => setNewClientPayment({ ...newClientPayment, reference: e.target.value })} />
                                                                </div>
                                                                <button onClick={handleAddClientPayment} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap h-[32px]">Add Payment</button>
                                                            </div>
                                                        </div>

                                                        {/* PAYMENTS TABLE */}
                                                        <div className="overflow-hidden border border-white/5 rounded-2xl">
                                                            <table className="w-full text-left text-xs">
                                                                <thead className="bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                    <tr>
                                                                        <th className="p-4">Date</th>
                                                                        <th className="p-4">Invoice</th>
                                                                        <th className="p-4">Amount</th>
                                                                        <th className="p-4">Mode</th>
                                                                        <th className="p-4">Reference</th>
                                                                        <th className="p-4">By</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-white/5">
                                                                    {form.commercialDetails?.client?.payments?.length ? form.commercialDetails.client.payments.map(p => (
                                                                        <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                                                            <td className="p-4 font-bold">{p.date}</td>
                                                                            <td className="p-4 opacity-50">{p.invoiceNo || '–'}</td>
                                                                            <td className="p-4 font-black">₹{p.amount.toLocaleString()}</td>
                                                                            <td className="p-4 px-2 py-1"><span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">{p.mode}</span></td>
                                                                            <td className="p-4 opacity-50 truncate max-w-[100px]">{p.reference}</td>
                                                                            <td className="p-4 opacity-50">{p.addedBy}</td>
                                                                        </tr>
                                                                    )) : (
                                                                        <tr><td colSpan={6} className="p-12 text-center text-slate-600 font-bold uppercase tracking-widest">No payment records found</td></tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeCommercialTab === 'vendor' && (
                                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Vendor Payment Ledger</h4>
                                                            <div className="flex gap-4">
                                                                <div className="text-right">
                                                                    <p className="text-[8px] font-black text-slate-500 uppercase">Paid To Vendor</p>
                                                                    <p className="text-sm font-black text-blue-400">₹{(form.commercialDetails?.vendor?.advancePaid || 0).toLocaleString()}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[8px] font-black text-slate-500 uppercase">Payable</p>
                                                                    <p className="text-sm font-black text-rose-400">₹{(form.commercialDetails?.vendor?.balancePayable || 0).toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* ADD VENDOR PAYMENT FORM */}
                                                        <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/10 space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-emerald-500/50 uppercase mb-2">Date</label>
                                                                    <input type="date" className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newVendorPayment.date || ''} onChange={e => setNewVendorPayment({ ...newVendorPayment, date: e.target.value })} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-emerald-500/50 uppercase mb-2">Amount</label>
                                                                    <input type="number" placeholder="₹ 0.00" className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newVendorPayment.amount || ''} onChange={e => setNewVendorPayment({ ...newVendorPayment, amount: parseFloat(e.target.value) || 0 })} />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-emerald-500/50 uppercase mb-2">Mode</label>
                                                                    <select className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newVendorPayment.mode} onChange={e => setNewVendorPayment({ ...newVendorPayment, mode: e.target.value as any })}>
                                                                        <option value="Bank">Bank</option>
                                                                        <option value="Cash">Cash</option>
                                                                        <option value="UPI">UPI</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[10px] font-black text-emerald-500/50 uppercase mb-2">Voucher #</label>
                                                                    <input type="text" placeholder="VCH-000" className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newVendorPayment.voucherNo || ''} onChange={e => setNewVendorPayment({ ...newVendorPayment, voucherNo: e.target.value })} />
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-4 items-end">
                                                                <div className="flex-1">
                                                                    <label className="block text-[10px] font-black text-emerald-500/50 uppercase mb-2">Reference / Remarks</label>
                                                                    <input type="text" placeholder="UTR / Bank Details..." className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={newVendorPayment.reference || ''} onChange={e => setNewVendorPayment({ ...newVendorPayment, reference: e.target.value })} />
                                                                </div>
                                                                <button onClick={handleAddVendorPayment} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest whitespace-nowrap h-[32px]">Add Vendor Payment</button>
                                                            </div>
                                                        </div>

                                                        {/* VENDOR PAYMENTS TABLE */}
                                                        <div className="overflow-hidden border border-emerald-500/10 rounded-2xl">
                                                            <table className="w-full text-left text-xs">
                                                                <thead className="bg-emerald-500/5 text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">
                                                                    <tr>
                                                                        <th className="p-4">Date</th>
                                                                        <th className="p-4">Voucher</th>
                                                                        <th className="p-4">Amount</th>
                                                                        <th className="p-4">Mode</th>
                                                                        <th className="p-4">Reference</th>
                                                                        <th className="p-4">Paid By</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-emerald-500/10">
                                                                    {form.commercialDetails?.vendor?.payments?.length ? form.commercialDetails.vendor.payments.map(p => (
                                                                        <tr key={p.id} className="hover:bg-emerald-500/5 transition-colors">
                                                                            <td className="p-4 font-bold">{p.date}</td>
                                                                            <td className="p-4 opacity-50">{p.voucherNo || '–'}</td>
                                                                            <td className="p-4 font-black">₹{p.amount.toLocaleString()}</td>
                                                                            <td className="p-4 px-2 py-1"><span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">{p.mode}</span></td>
                                                                            <td className="p-4 opacity-50 truncate max-w-[100px]">{p.reference}</td>
                                                                            <td className="p-4 opacity-50">{p.paidBy}</td>
                                                                        </tr>
                                                                    )) : (
                                                                        <tr><td colSpan={6} className="p-12 text-center text-slate-600 font-bold uppercase tracking-widest">No vendor payments found</td></tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                                {activeCommercialTab === 'downloads' && (
                                                    <div className="space-y-8 animate-in mt-12 fade-in slide-in-from-right-4 duration-300">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <button onClick={handleExportClientLedgerPDF} className="bg-white/5 border border-white/10 hover:bg-white/10 p-8 rounded-3xl flex flex-col items-center gap-4 group transition-all">
                                                                <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <FileDown size={32} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-black text-white uppercase tracking-widest">Client Ledger</p>
                                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Download PDF Report</p>
                                                                </div>
                                                            </button>

                                                            <button onClick={handleExportVendorLedgerPDF} className="bg-white/5 border border-white/10 hover:bg-white/10 p-8 rounded-3xl flex flex-col items-center gap-4 group transition-all">
                                                                <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <FileText size={32} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-black text-white uppercase tracking-widest">Vendor Ledger</p>
                                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Download PDF Report</p>
                                                                </div>
                                                            </button>

                                                            <button onClick={handleExportFullProjectLedgerExcel} className="bg-white/5 border border-white/10 hover:bg-white/10 p-8 rounded-3xl flex flex-col items-center gap-4 group transition-all">
                                                                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <Download size={32} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-black text-white uppercase tracking-widest">Full Project Ledger</p>
                                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Export Excel Spreadsheet</p>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="pt-8 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={handleSubmit}
                                                        className="px-12 py-4 bg-white text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                                                    >
                                                        Save All Commercial Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'direct_expenses' && (
                                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                                        {/* Expenses Header & Stats */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">Project Expenses</h2>
                                                <p className="text-slate-500">Track raw materials, labor, and operational costs.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg shadow-slate-500/20 mr-2">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Expenses</p>
                                                    <p className="text-2xl font-black">
                                                        ₹{expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                                                    </p>
                                                </div>

                                                {/* Export/Import Buttons */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleExportExpensesPDF}
                                                            title="Export PDF"
                                                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-red-600 transition-colors"
                                                        >
                                                            <FileDown size={18} />
                                                        </button>
                                                        <button
                                                            onClick={handleExportExpensesExcel}
                                                            title="Export Excel"
                                                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-green-600 transition-colors"
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept=".xlsx,.xls"
                                                            onChange={handleImportExpenses}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            title="Import Excel"
                                                        />
                                                        <button
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-blue-600 transition-colors flex justify-center"
                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add Expense Form */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                                                <Plus size={16} className="mr-2 text-blue-500" /> New Expense Entry
                                            </h3>
                                            <form onSubmit={handleSaveExpense} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Expense Name (e.g. Steel Rods)"
                                                        required
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={expenseForm.name}
                                                        onChange={e => setExpenseForm({ ...expenseForm, name: e.target.value })}
                                                    />
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Amount"
                                                            required
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                            value={expenseForm.amount}
                                                            onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <select
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={expenseForm.category}
                                                        onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                                                    >
                                                        <option value="Raw Material">Raw Material</option>
                                                        <option value="Machining/Production">Machining/Production</option>
                                                        <option value="Labor">Labor</option>
                                                        <option value="Packaging & Transport">Packaging & Transport</option>
                                                        <option value="Overheads">Overheads</option>
                                                        <option value="Other">Other</option>
                                                    </select>

                                                    <input
                                                        type="date"
                                                        required
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={expenseForm.date}
                                                        onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                                    />

                                                    <input
                                                        type="text"
                                                        placeholder="Paid By"
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={expenseForm.paidBy}
                                                        onChange={e => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <select
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={expenseForm.status}
                                                        onChange={e => setExpenseForm({ ...expenseForm, status: e.target.value as any })}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Approved">Approved</option>
                                                        <option value="Rejected">Rejected</option>
                                                    </select>
                                                    <input
                                                        type="text"
                                                        placeholder="Notes (Optional)"
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={expenseForm.notes}
                                                        onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                                    />
                                                </div>

                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        type="submit"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30 active:scale-95"
                                                    >
                                                        Add Expense
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Expenses List */}
                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Expense</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Paid By</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {loadingExpenses ? (
                                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading expenses...</td></tr>
                                                    ) : expenses.length === 0 ? (
                                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium">No expenses recorded yet.</td></tr>
                                                    ) : (
                                                        expenses.map((expense) => (
                                                            <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-bold text-slate-500">
                                                                    {expense.date}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <p className="text-sm font-bold text-slate-900">{expense.name}</p>
                                                                    {expense.notes && <p className="text-xs text-slate-400 truncate max-w-[150px]">{expense.notes}</p>}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                                                                        {expense.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-slate-600">
                                                                    {expense.paidBy || '-'}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${expense.status === 'Approved' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                                        expense.status === 'Rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                                            'bg-amber-50 text-amber-600 border border-amber-100'
                                                                        }`}>
                                                                        {expense.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                                                                    ₹{expense.amount?.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'extra_expenses' && (
                                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                            <div>
                                                <h2 className="text-2xl font-black text-amber-600">Extra Expenses</h2>
                                                <p className="text-slate-500">Company-borne overheads (Transport, Labor, etc.)</p>
                                            </div>
                                            <div className="bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20">
                                                <p className="text-xs font-bold text-amber-100 uppercase tracking-wider mb-1">Company Cost</p>
                                                <p className="text-2xl font-black">
                                                    ₹{extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-4 flex items-center">
                                                <Plus size={16} className="mr-2 text-amber-600" /> Record Extra Expense
                                            </h3>
                                            <form onSubmit={handleSaveExtraExpense} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase mb-2 ml-1">Expense Date</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                            value={extraExpenseForm.date}
                                                            onChange={e => setExtraExpenseForm({ ...extraExpenseForm, date: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase mb-2 ml-1">Expense Type</label>
                                                        <select
                                                            className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                            value={extraExpenseForm.type}
                                                            onChange={e => setExtraExpenseForm({ ...extraExpenseForm, type: e.target.value })}
                                                        >
                                                            <option value="Transport">Transport</option>
                                                            <option value="Labor">Labor</option>
                                                            <option value="Packaging">Packaging</option>
                                                            <option value="Fuel">Fuel</option>
                                                            <option value="Food & Stay">Food & Stay</option>
                                                            <option value="Commission">Commission</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase mb-2 ml-1">Amount</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-bold">₹</span>
                                                            <input
                                                                type="number"
                                                                required
                                                                min="0"
                                                                className="w-full bg-white border border-amber-100 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                                value={extraExpenseForm.amount}
                                                                onChange={e => setExtraExpenseForm({ ...extraExpenseForm, amount: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase mb-2 ml-1">Payment Mode</label>
                                                        <select
                                                            className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                            value={extraExpenseForm.mode}
                                                            onChange={e => setExtraExpenseForm({ ...extraExpenseForm, mode: e.target.value as any })}
                                                        >
                                                            <option value="Bank">Bank</option>
                                                            <option value="Cash">Cash</option>
                                                            <option value="UPI">UPI</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase mb-2 ml-1">Reference No.</label>
                                                        <input
                                                            type="text"
                                                            placeholder="UTR / ID"
                                                            className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                            value={extraExpenseForm.reference}
                                                            onChange={e => setExtraExpenseForm({ ...extraExpenseForm, reference: e.target.value })}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-black text-amber-600/60 uppercase mb-2 ml-1">Remarks</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Note"
                                                            className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                                            value={extraExpenseForm.remarks}
                                                            onChange={e => setExtraExpenseForm({ ...extraExpenseForm, remarks: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        type="submit"
                                                        className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/30 active:scale-95"
                                                    >
                                                        Add Extra Expense
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead className="bg-amber-50/50 border-b border-amber-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-xs font-black text-amber-600 uppercase tracking-widest">Date</th>
                                                        <th className="px-6 py-4 text-xs font-black text-amber-600 uppercase tracking-widest">Type</th>
                                                        <th className="px-6 py-4 text-xs font-black text-amber-600 uppercase tracking-widest">Amount</th>
                                                        <th className="px-6 py-4 text-xs font-black text-amber-600 uppercase tracking-widest">Mode</th>
                                                        <th className="px-6 py-4 text-xs font-black text-amber-600 uppercase tracking-widest">Reference</th>
                                                        <th className="px-6 py-4 text-xs font-black text-amber-600 uppercase tracking-widest">Added By</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-50">
                                                    {loadingExtraExpenses ? (
                                                        <tr><td colSpan={6} className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">Loading...</td></tr>
                                                    ) : extraExpenses.length === 0 ? (
                                                        <tr><td colSpan={6} className="p-12 text-center text-slate-300 font-black uppercase tracking-widest">No extra expenses recorded</td></tr>
                                                    ) : (
                                                        extraExpenses.map((e) => (
                                                            <tr key={e.id} className="hover:bg-amber-50/30 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-bold text-slate-500">{e.date}</td>
                                                                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-black uppercase">{e.type}</span></td>
                                                                <td className="px-6 py-4 text-sm font-black text-slate-900">₹{e.amount?.toLocaleString()}</td>
                                                                <td className="px-6 py-4"><span className="text-[10px] font-black uppercase text-slate-400">{e.mode}</span></td>
                                                                <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-[120px]">{e.reference || '–'}</td>
                                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{e.addedBy}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'income' && (
                                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

                                        {/* Income Header & Stats */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900">Project Income</h2>
                                                <p className="text-slate-500">Track revenue, invoices, and payments.</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-green-500/20 mr-2">
                                                    <p className="text-xs font-bold text-green-100 uppercase tracking-wider mb-1">Total Income</p>
                                                    <p className="text-2xl font-black">
                                                        ₹{incomes.reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()}
                                                    </p>
                                                </div>

                                                {/* Export/Import Buttons */}
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleExportIncomePDF}
                                                            title="Export PDF"
                                                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-red-600 transition-colors"
                                                        >
                                                            <FileDown size={18} />
                                                        </button>
                                                        <button
                                                            onClick={handleExportIncomeExcel}
                                                            title="Export Excel"
                                                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-green-600 transition-colors"
                                                        >
                                                            <Download size={18} />
                                                        </button>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept=".xlsx,.xls"
                                                            onChange={handleImportIncome}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            title="Import Excel"
                                                        />
                                                        <button
                                                            className="w-full p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-blue-600 transition-colors flex justify-center"
                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Add Income Form */}
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center">
                                                <Plus size={16} className="mr-2 text-green-600" /> New Income Record
                                            </h3>
                                            <form onSubmit={handleSaveIncome} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Client Name"
                                                        required
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={incomeForm.clientName}
                                                        onChange={e => setIncomeForm({ ...incomeForm, clientName: e.target.value })}
                                                    />
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Amount"
                                                            required
                                                            min="0"
                                                            step="0.01"
                                                            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                            value={incomeForm.amount}
                                                            onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Invoice Number"
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:focus:border-blue-500 outline-none"
                                                        value={incomeForm.invoiceNumber}
                                                        onChange={e => setIncomeForm({ ...incomeForm, invoiceNumber: e.target.value })}
                                                    />

                                                    <input
                                                        type="date"
                                                        required
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={incomeForm.receivedDate}
                                                        onChange={e => setIncomeForm({ ...incomeForm, receivedDate: e.target.value })}
                                                    />

                                                    <select
                                                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                        value={incomeForm.status}
                                                        onChange={e => setIncomeForm({ ...incomeForm, status: e.target.value as any })}
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Received">Received</option>
                                                    </select>
                                                </div>

                                                <div className="flex justify-end pt-2">
                                                    <button
                                                        type="submit"
                                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-green-500/30 active:scale-95"
                                                    >
                                                        Record Income
                                                    </button>
                                                </div>
                                            </form>
                                        </div>

                                        {/* Income List */}
                                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                            <table className="w-full">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-900 uppercase tracking-wider">Client</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice #</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {loadingIncomes ? (
                                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading income records...</td></tr>
                                                    ) : incomes.length === 0 ? (
                                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No income recorded yet.</td></tr>
                                                    ) : (
                                                        incomes.map((income) => (
                                                            <tr key={income.id} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-bold text-slate-500">
                                                                    {income.receivedDate}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-bold text-slate-900">
                                                                    {income.clientName}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                                        {income.invoiceNumber || 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${income.status === 'Received' ? 'bg-green-50 text-green-600 border border-green-100' :
                                                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                                                        }`}>
                                                                        {income.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right text-sm font-black text-slate-900">
                                                                    ₹{income.amount?.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'profit_loss' && (() => {
                                    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);
                                    const directExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                                    const totalExtraExpenses = extraExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
                                    const totalExpenses = directExpenses + totalExtraExpenses;
                                    const netProfit = totalIncome - totalExpenses;
                                    const isProfitable = netProfit >= 0;

                                    return (
                                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                                <div>
                                                    <h2 className="text-2xl font-black text-slate-900">Profit & Loss</h2>
                                                    <p className="text-slate-500">Real-time financial health of your project.</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* Income Card */}
                                                <div className="bg-green-50 border border-green-100 rounded-2xl p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                                                            <CheckCircle2 size={20} />
                                                        </div>
                                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-lg">CREDIT</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500">Total Income</p>
                                                    <p className="text-3xl font-black text-slate-900 mt-1">₹{totalIncome.toLocaleString()}</p>
                                                </div>

                                                {/* Expenses Card */}
                                                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                                            <ClipboardList size={20} />
                                                        </div>
                                                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">DEBIT</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500">Total Expenses</p>
                                                    <p className="text-3xl font-black text-slate-900 mt-1">₹{totalExpenses.toLocaleString()}</p>
                                                </div>

                                                {/* Profit Card */}
                                                <div className={`border rounded-2xl p-6 ${isProfitable ? 'bg-slate-900 border-slate-800' : 'bg-orange-50 border-orange-100'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isProfitable ? 'bg-slate-800 text-white' : 'bg-orange-100 text-orange-600'}`}>
                                                            <Building2 size={20} />
                                                        </div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isProfitable ? 'text-white bg-slate-800' : 'text-orange-600 bg-orange-100'}`}>
                                                            NET {isProfitable ? 'PROFIT' : 'LOSS'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm font-bold ${isProfitable ? 'text-slate-400' : 'text-orange-800/60'}`}>Net Profit</p>
                                                    <p className={`text-3xl font-black mt-1 ${isProfitable ? 'text-white' : 'text-orange-900'}`}>
                                                        ₹{Math.abs(netProfit).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Summary Bar */}
                                            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                                                <h3 className="text-lg font-bold text-slate-900 mb-6">Financial Overview</h3>

                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between text-sm font-bold">
                                                        <span className="text-slate-500">Profit Margin</span>
                                                        <span className={isProfitable ? 'text-green-600' : 'text-red-500'}>
                                                            {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%
                                                        </span>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                                                        {totalIncome > 0 && (
                                                            <>
                                                                <div
                                                                    className="h-full bg-red-500"
                                                                    style={{ width: `${Math.min((totalExpenses / totalIncome) * 100, 100)}%` }}
                                                                />
                                                                <div
                                                                    className="h-full bg-green-500"
                                                                    style={{ width: `${Math.max(((totalIncome - totalExpenses) / totalIncome) * 100, 0)}%` }}
                                                                />
                                                            </>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                        <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>Expenses</div>
                                                        <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>Profit</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {activeTab === 'documents' && (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-slate-400">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                            <FileText size={40} className="text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Documents</h3>
                                            <p className="max-w-xs mx-auto mt-2">Store and manage project files, contracts, and specs. Coming soon.</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'activity' && (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-slate-400">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                                            <Clock size={40} className="text-slate-300" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900">Activity Log</h3>
                                            <p className="max-w-xs mx-auto mt-2">Audit trail of all changes and updates. Coming soon.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
