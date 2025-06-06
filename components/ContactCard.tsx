"use client";

import { HubSpotContact, HubSpotContactWithSaved } from "@/types/hubspot";
import { useContactContext } from "@/context/ContactContext";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { IconPencil, IconTextPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { unsaveContact } from "@/app/actions/prisma/unsaveContact";
import { saveContact } from "@/app/actions/prisma/saveContact";

export function ContactCard({
  contact,
  href,
  savedIds,
  mutateSavedIds,
}: {
  contact: HubSpotContactWithSaved;
  href: string;
  savedIds: string[];
  mutateSavedIds?: () => void;
}) {
  // const [logOpen, setLogOpen] = useState(false);
  // const logListRef = useRef<MeetingLogListRef | null>(null);
  const [isSaved, setIsSaved] = useState(savedIds.includes(contact.id));

  useEffect(() => {
    setIsSaved(savedIds.includes(contact.id));
  }, [savedIds, contact.id]);

  const toggleSaved = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      await unsaveContact(contact.id);
      setIsSaved(false);
      mutateSavedIds?.(); // ✅ remove from UI list
    } else {
      await saveContact(contact.id);
      setIsSaved(true);
      // ⛔️ don't call mutateSavedIds here — let SWR revalidate passively if needed
    }
  };

  const {
    setEditOpen,
    setSelectedContact,
    setContactId,
    setLogContactData,
    setLogOpen,
  } = useContactContext();

  const router = useRouter();

  const {
    email,
    phone,
    company,
    city,
    address,
    state,
    zip,
    hs_lead_status,
    l2_lead_status,
  } = contact.properties;

  const safeId = encodeURIComponent(contact.id ?? "");
  const validL2Statuses = ["assigned", "visited", "dropped off"];
  const showBadge =
    hs_lead_status === "Samples" &&
    validL2Statuses.includes(l2_lead_status ?? "");

  const fullAddress = `${contact.properties.address || "-"}, ${
    contact.properties.city || "-"
  }`;

  function capitalizeWords(str: string) {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return (
    <>
      <Card
        onClick={() => router.push(`/dashboard/contacts/${safeId}`)}
        // className="hover:shadow-lg transition-shadow h-full flex flex-col gap-0 dark:bg-muted/50"
        className="shadow-md shadow-gray-200 dark:shadow-black/30 hover:shadow-lg transition-shadow h-full flex flex-col gap-0 dark:bg-[#161b22] dark:border dark:border-[#30363d]"
      >
        <div className="cursor-pointer flex-grow">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="font-bold uppercase text-md bg-gray-100 dark:bg-[#30363d] text-zinc-700 dark:text-gray-100 p-3 rounded">
              {company || "-"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" /> {email || "-"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" /> {phone || "-"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />{" "}
              {capitalizeWords(fullAddress.toLocaleLowerCase())}, {state || "-"}{" "}
              {zip || "-"}
            </div>
            {showBadge && <StatusBadge status={l2_lead_status || "unknown"} />}
          </CardContent>
        </div>

        <div className="flex gap-1 px-4 pb-4">
          <button
            className="text-sm cursor-pointer flex items-center gap-1 p-2 text-green-400 hover:underline underline-offset-4"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedContact(contact);
              setEditOpen(true);
            }}
          >
            <IconPencil size={18} /> Edit
          </button>

          <button
            className="text-sm cursor-pointer flex items-center gap-1 p-2 text-[#4493f8] hover:underline underline-offset-4"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              setContactId(contact.id); // ✅ Sets ID
              setLogContactData(contact); // ✅ Sets full contact
              setLogOpen(true);
            }}
          >
            <IconTextPlus size={18} /> Log Meeting
          </button>

          <button
            className="text-sm cursor-pointer flex items-center gap-1 p-2 text-gray-400 hover:underline 
            underline-offset-4 ml-auto"
            onClick={toggleSaved}
          >
            {isSaved ? (
              <>
                <BookmarkCheck size={18} className="text-amber-300" /> Saved
              </>
            ) : (
              <>
                <Bookmark size={18} /> Save
              </>
            )}
          </button>
        </div>
      </Card>
    </>
  );
}
