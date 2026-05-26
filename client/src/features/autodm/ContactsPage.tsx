import { Download, ExternalLink, Filter, MessageCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listContacts, listMessagesForContact } from "@/services/autodm/contacts";
import { useAutoDM } from "./AutoDMContext";
import { AutoDMConnectionGate } from "./AutoDMConnectionGate";
import { formatRelativeTime } from "./utils";

export default function ContactsPage() {
  const { socialUser, activeAccount } = useAutoDM();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  useEffect(() => {
    if (!socialUser?.userId || !activeAccount?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        setContacts(await listContacts({ userId: socialUser.userId, instagramAccountId: activeAccount.id }));
      } catch (error) {
        toast.error(error.message || "Failed to load contacts");
      } finally {
        setLoading(false);
      }
    })();
  }, [socialUser?.userId, activeAccount?.id]);

  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) => {
        const query = searchQuery.toLowerCase();
        return contact.username?.toLowerCase().includes(query) || contact.full_name?.toLowerCase().includes(query);
      }),
    [contacts, searchQuery]
  );

  return (
    <AutoDMConnectionGate>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Contacts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everyone who has interacted with your Auto DM automations.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search contacts..." className="pl-10" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const headers = ["Username", "Name", "Messages Sent", "Messages Received", "Last Interaction"];
                const rows = contacts.map((contact) => [contact.username, contact.full_name || "", contact.total_messages_sent || 0, contact.total_messages_received || 0, contact.last_interaction_at || ""]);
                const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "autodm-contacts.csv";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {!loading && filteredContacts.length > 0 ? (
          <div className="grid gap-3 md:hidden">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="rounded-[20px] border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.profile_picture_url || ""} />
                    <AvatarFallback>{(contact.username || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--ink)]">{contact.full_name || contact.username}</p>
                    <a href={`https://instagram.com/${contact.username}`} target="_blank" rel="noreferrer" className="mt-0.5 flex items-center gap-1 text-xs text-primary hover:underline">
                      @{contact.username}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-[12px] bg-black/[0.04] p-2">
                        <p className="text-[var(--slate)]">Received</p>
                        <p className="font-semibold text-[var(--ink)]">{contact.total_messages_received || 0}</p>
                      </div>
                      <div className="rounded-[12px] bg-black/[0.04] p-2">
                        <p className="text-[var(--slate)]">Sent</p>
                        <p className="font-semibold text-[var(--ink)]">{contact.total_messages_sent || 0}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs text-[var(--slate)]">{formatRelativeTime(contact.last_interaction_at)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          setSelectedContact(contact);
                          setMessagesLoading(true);
                          try {
                            setMessages(await listMessagesForContact(contact.id, socialUser.userId));
                          } catch (error) {
                            toast.error(error.message || "Failed to load message history");
                          } finally {
                            setMessagesLoading(false);
                          }
                        }}
                      >
                        <MessageCircle className="mr-1 h-4 w-4" />
                        History
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <Card className="overflow-hidden rounded-[22px] border-black/10 shadow-sm">
          <CardContent className="p-0">
            <div className={`overflow-x-auto ${!loading && filteredContacts.length > 0 ? "hidden md:block" : ""}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50/70">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Messages</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relationship</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Last Interaction</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-6 py-4"><Skeleton className="h-10 w-40 rounded-full" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="ml-auto h-8 w-24" /></td>
                      </tr>
                    ))
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-sm text-muted-foreground">No contacts found yet.</td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => (
                      <tr key={contact.id} className="border-b hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={contact.profile_picture_url || ""} />
                              <AvatarFallback>{(contact.username || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-900">{contact.full_name || contact.username}</p>
                              <a href={`https://instagram.com/${contact.username}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                @{contact.username}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-blue-600">{contact.total_messages_received || 0} received</span>
                            <span className="text-purple-600">{contact.total_messages_sent || 0} sent</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {contact.you_are_following ? <Badge variant="outline">You Follow</Badge> : null}
                            {contact.is_following_you ? <Badge variant="outline">Follows You</Badge> : null}
                            {!contact.you_are_following && !contact.is_following_you ? <span className="text-xs text-muted-foreground">No direct follow</span> : null}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatRelativeTime(contact.last_interaction_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              setSelectedContact(contact);
                              setMessagesLoading(true);
                              try {
                                setMessages(await listMessagesForContact(contact.id, socialUser.userId));
                              } catch (error) {
                                toast.error(error.message || "Failed to load message history");
                              } finally {
                                setMessagesLoading(false);
                              }
                            }}
                          >
                            <MessageCircle className="mr-2 h-4 w-4" />
                            View History
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(selectedContact)} onOpenChange={() => setSelectedContact(null)}>
          <DialogContent className="flex h-[80vh] max-w-2xl flex-col p-0">
            <DialogHeader className="border-b p-6">
              <DialogTitle>Chat history with @{selectedContact?.username}</DialogTitle>
              <DialogDescription>Inbound messages and automated replies logged by Auto DM.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto bg-slate-50/60 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-10"><Skeleton className="h-8 w-8 rounded-full" /></div>
              ) : messages.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No message history found.</div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${message.direction === "outbound" ? "bg-primary text-primary-foreground" : "border border-gray-100 bg-white"}`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-1 text-[10px] opacity-70">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AutoDMConnectionGate>
  );
}
