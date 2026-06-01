import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { translations } from '../translations';
import { 
  PlusCircle, 
  Search, 
  MoreVertical, 
  Phone, 
  Mail, 
  MapPin, 
  Hash, 
  Users, 
  X, 
  Trash2, 
  Archive,
  UserPlus,
  Briefcase
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient, archiveClient, addContactPerson, deleteContactPerson, settings } = useApp();
  const t = translations[settings.language];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedClientForContact, setSelectedClientForContact] = useState<string | null>(null);

  const [newClient, setNewClient] = useState({
    name: '',
    postcode: '',
    street: '',
    houseNumber: '',
    city: '',
    state: '',
    country: '',
    phone: '',
    email: '',
    kvk: ''
  });

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const filteredClients = clients.filter(c => 
    !c.archived && (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddClient = () => {
    if (!newClient.name) return;
    addClient(newClient);
    setNewClient({ 
      name: '', 
      postcode: '', 
      street: '', 
      houseNumber: '', 
      city: '', 
      state: '', 
      country: '', 
      phone: '', 
      email: '', 
      kvk: '' 
    });
    setIsAddClientOpen(false);
  };

  const handleAddContact = (clientId: string) => {
    if (!newContact.name) return;
    addContactPerson(clientId, newContact);
    setNewContact({ name: '', email: '', phone: '' });
    setSelectedClientForContact(null);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className={cn(
            "text-4xl font-black italic tracking-tighter uppercase mb-2 underline decoration-sky-500/30 underline-offset-8",
            settings.theme === 'light' ? "text-slate-900" : "text-white"
          )}>
            {t.clients}
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em]">{clients.length} {t.registeredOrganizations}</p>
        </div>
        <button 
          onClick={() => setIsAddClientOpen(true)}
          className="flex items-center gap-2 px-6 py-4 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
        >
          <PlusCircle size={18} strokeWidth={3} />
          {t.addClient}
        </button>
      </div>

      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-sky-500 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder={t.searchClientPlaceholder}
          className={cn(
            "w-full pl-12 pr-4 py-5 border rounded-2xl focus:ring-1 focus:ring-sky-500 outline-none transition-all placeholder:text-slate-400 font-medium",
            settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-900 border-slate-800 text-white"
          )}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredClients.map((client) => (
            <motion.div 
              key={client.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "glass rounded-[2rem] p-8 border transition-all group relative overflow-hidden",
                settings.theme === 'light' ? "bg-white border-slate-200 hover:border-sky-200 shadow-sm" : "bg-slate-900/40 border-slate-800 hover:border-slate-700 shadow-xl"
              )}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                    settings.theme === 'light' 
                      ? "bg-slate-50 text-sky-500 shadow-inner group-hover:bg-sky-500 group-hover:text-white" 
                      : "bg-slate-800 text-sky-400 shadow-inner group-hover:bg-sky-500 group-hover:text-slate-950"
                  )}>
                    <Briefcase size={24} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className={cn("text-xl font-black uppercase italic tracking-tight", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{client.name}</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                       <Hash size={12} /> {client.kvk || t.noKvk}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => archiveClient(client.id)}
                    className="p-2 text-slate-500 hover:text-amber-500 transition-colors"
                  >
                    <Archive size={18} />
                  </button>
                  <button 
                    onClick={() => deleteClient(client.id)}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-sm">
                <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-500 transition-colors">
                    <MapPin size={16} className="text-sky-500" />
                    <span className={cn(settings.theme === 'light' ? "text-slate-600" : "text-slate-400")}>
                      {client.street} {client.houseNumber}<br />
                      {client.postcode} {client.city}<br />
                      {client.state && `${client.state}, `}{client.country}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-500 transition-colors">
                    <Phone size={16} className="text-sky-500" />
                    <span className={cn(settings.theme === 'light' ? "text-slate-600" : "text-slate-400")}>{client.phone}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-500 transition-colors">
                    <Mail size={16} className="text-sky-500" />
                    <span className={cn("truncate", settings.theme === 'light' ? "text-slate-600" : "text-slate-400")}>{client.email}</span>
                  </div>
                </div>
              </div>

              <div className={cn("border-t pt-6", settings.theme === 'light' ? "border-slate-100" : "border-slate-800")}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Users size={14} /> {t.contactPersons} ({client.contactPersons.length})
                  </h4>
                  <button 
                    onClick={() => setSelectedClientForContact(client.id)}
                    className="text-[9px] font-black text-sky-500 hover:text-sky-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                  >
                    <PlusCircle size={12} /> {t.addContact}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {client.contactPersons.map(person => (
                    <div key={person.id} className={cn(
                      "rounded-xl p-3 border relative group/contact",
                      settings.theme === 'light' ? "bg-slate-50 border-slate-200" : "bg-slate-900/50 border-slate-800"
                    )}>
                      <p className={cn("text-xs font-bold mb-1 uppercase tracking-tight", settings.theme === 'light' ? "text-slate-900" : "text-white")}>{person.name}</p>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate"><Mail size={10} /> {person.email}</span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1"><Phone size={10} /> {person.phone}</span>
                      </div>
                      <button 
                        onClick={() => deleteContactPerson(client.id, person.id)}
                        className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover/contact:opacity-100 transition-all"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {client.contactPersons.length === 0 && (
                    <p className={cn(
                      "col-span-full py-4 text-center text-[10px] font-bold uppercase tracking-widest border border-dashed rounded-xl",
                      settings.theme === 'light' ? "text-slate-400 border-slate-200" : "text-slate-700 border-slate-800"
                    )}>
                      {t.noContactPersons}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Client Dialog */}
      <AnimatePresence>
        {isAddClientOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddClientOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-2xl glass border rounded-[2.5rem] shadow-2xl overflow-hidden",
                settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
              )}
            >
              <div className="p-8 pb-0 flex justify-between items-center">
                 <h3 className={cn("text-xl font-black uppercase italic tracking-widest", settings.theme === 'light' ? "text-slate-950" : "text-white")}>{t.addClient}</h3>
                 <button onClick={() => setIsAddClientOpen(false)} className="p-2 text-slate-500 hover:text-sky-500 transition-colors">
                   <X size={24} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.client}</label>
                    <input 
                      type="text" 
                      className={cn(
                        "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-400 font-medium text-sm",
                        settings.theme === 'light' ? "bg-sky-50 border-sky-100 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                      )}
                      placeholder={t.companyName}
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.street}</label>
                      <input 
                        type="text" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="Hoofdstraat"
                        value={newClient.street}
                        onChange={(e) => setNewClient({...newClient, street: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.houseNumber}</label>
                      <input 
                        type="text" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="12 A"
                        value={newClient.houseNumber}
                        onChange={(e) => setNewClient({...newClient, houseNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.city}</label>
                      <input 
                        type="text" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="Amsterdam"
                        value={newClient.city}
                        onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.postcode}</label>
                      <input 
                        type="text" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="1234 AB"
                        value={newClient.postcode}
                        onChange={(e) => setNewClient({...newClient, postcode: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.state}</label>
                      <input 
                        type="text" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="California"
                        value={newClient.state}
                        onChange={(e) => setNewClient({...newClient, state: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.country}</label>
                      <input 
                        type="text" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="Netherlands / USA"
                        value={newClient.country}
                        onChange={(e) => setNewClient({...newClient, country: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.phone}</label>
                      <input 
                        type="text" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="06 12345678"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                      <input 
                        type="email" 
                        className={cn(
                          "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        placeholder="info@bedrijf.nl"
                        value={newClient.email}
                        onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.kvk}</label>
                    <input 
                      type="text" 
                      className={cn(
                        "w-full border rounded-2xl p-4 focus:ring-1 focus:ring-sky-400 outline-none transition-all placeholder:text-slate-500 font-medium text-sm",
                        settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                      )}
                      placeholder="12345678"
                      value={newClient.kvk}
                      onChange={(e) => setNewClient({...newClient, kvk: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setIsAddClientOpen(false)}
                    className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={handleAddClient}
                    className="flex-[2] py-4 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Contact Dialog */}
      <AnimatePresence>
        {selectedClientForContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClientForContact(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "relative w-full max-w-md glass border rounded-[2.5rem] shadow-2xl overflow-hidden",
                settings.theme === 'light' ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
              )}
            >
              <div className="p-8 pb-0 flex justify-between items-center">
                 <h3 className={cn("text-xl font-black uppercase italic tracking-widest", settings.theme === 'light' ? "text-slate-950" : "text-white")}>{t.addContact}</h3>
                 <button onClick={() => setSelectedClientForContact(null)} className="p-2 text-slate-500 hover:text-sky-500 transition-colors">
                   <X size={24} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.contactNamePlaceholder}</label>
                    <div className="relative group">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        className={cn(
                          "w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                      <input 
                        type="email" 
                        required
                        className={cn(
                          "w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        value={newContact.email}
                        onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.phone}</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-400 transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        className={cn(
                          "w-full pl-12 pr-4 py-4 border rounded-2xl focus:ring-1 focus:ring-sky-400 outline-none transition-all text-sm",
                          settings.theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-slate-950/50 border-slate-800 text-white"
                        )}
                        value={newContact.phone}
                        onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setSelectedClientForContact(null)}
                    className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-white transition-colors"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={() => handleAddContact(selectedClientForContact)}
                    className="flex-[2] py-4 bg-sky-500 text-slate-950 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-sky-500/20 active:scale-[0.98] transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clients;
