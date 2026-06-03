import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BookOpen, Search, Plus, Pin, Folder, Tag, MoreVertical } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListNotes, 
  useCreateNote, 
  useUpdateNote,
  getListNotesQueryKey 
} from "@workspace/api-client-react";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  content: z.string().min(1, "Content is required"),
  tags: z.string().optional(),
  isPinned: z.boolean().default(false),
});

const CATEGORIES = ["All", "Forex", "SMC/ICT", "AI", "Sales", "Web Dev"];

export default function KnowledgeVault() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const queryParams = {
    ...(selectedCategory !== "All" ? { category: selectedCategory } : {}),
    ...(search ? { q: search } : {}),
  };

  const { data: notes, isLoading } = useListNotes(queryParams);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      category: "Forex",
      content: "",
      tags: "",
      isPinned: false,
    },
  });

  const onSubmit = (data: z.infer<typeof noteSchema>) => {
    createNote.mutate({ data }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      }
    });
  };

  const togglePin = (id: number, currentPinned: boolean) => {
    updateNote.mutate({ id, data: { isPinned: !currentPinned } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey() });
      }
    });
  };

  const selectedNote = useMemo(() => notes?.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

  const displayNotes = useMemo(() => {
    if (!notes) return [];
    return [...notes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notes]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Knowledge Vault</h1>
            <p className="text-muted-foreground">Institutional repository for strategies and systems.</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create Vault Entry</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="Entry title..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CATEGORIES.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="tags" render={({ field }) => (
                    <FormItem><FormLabel>Tags (comma separated)</FormLabel><FormControl><Input placeholder="liquidity, asian session..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="isPinned" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Pin Entry</FormLabel>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem><FormLabel>Content (Markdown supported)</FormLabel><FormControl>
                    <Textarea className="min-h-[200px] font-mono text-sm" placeholder="Write content here..." {...field} />
                  </FormControl><FormMessage /></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={createNote.isPending}>
                  {createNote.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Sidebar/List */}
        <div className="w-full md:w-[350px] shrink-0 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search vault..." 
              className="pl-9 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <Badge 
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap ${selectedCategory === cat ? "bg-primary" : "hover:bg-white/5"}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
          
          <Card className="flex-1 bg-card border-border overflow-hidden flex flex-col">
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted/20 animate-pulse rounded-md" />)}
                </div>
              ) : displayNotes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">No entries found.</div>
              ) : (
                <div className="divide-y divide-border">
                  {displayNotes.map(note => (
                    <div 
                      key={note.id} 
                      className={`p-4 cursor-pointer transition-colors hover:bg-white/5 ${selectedNoteId === note.id ? "bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent"}`}
                      onClick={() => setSelectedNoteId(note.id)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-semibold text-sm line-clamp-1 flex-1">{note.title}</h3>
                        {note.isPinned && <Pin className="h-3 w-3 text-primary ml-2 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">{note.category}</Badge>
                        <span>{format(new Date(note.createdAt), "MMM d")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>

        {/* Main Content Area */}
        <Card className="flex-1 bg-card border-border overflow-hidden flex flex-col">
          {selectedNote ? (
            <>
              <div className="p-6 border-b border-border flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-2">
                    {selectedNote.isPinned && <Pin className="h-5 w-5 text-primary" />}
                    {selectedNote.title}
                  </h2>
                  <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Folder className="h-4 w-4" /> {selectedNote.category}</span>
                    <span>•</span>
                    <span>Updated {format(new Date(selectedNote.updatedAt), "MMM d, yyyy")}</span>
                    {selectedNote.tags && (
                      <>
                        <span>•</span>
                        <div className="flex gap-1">
                          {selectedNote.tags.split(',').map(t => (
                            <Badge key={t} variant="outline" className="text-[10px]"><Tag className="h-3 w-3 mr-1" />{t.trim()}</Badge>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => togglePin(selectedNote.id, !!selectedNote.isPinned)}>
                  <Pin className={`h-4 w-4 ${selectedNote.isPinned ? "text-primary fill-primary" : "text-muted-foreground"}`} />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6 prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#0f0f12] prose-pre:border prose-pre:border-border">
                  <div className="whitespace-pre-wrap font-mono text-sm text-foreground/90">{selectedNote.content}</div>
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
              <BookOpen className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground">No Entry Selected</h3>
              <p className="max-w-sm mt-2">Select an entry from the list or create a new one to view its contents.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
