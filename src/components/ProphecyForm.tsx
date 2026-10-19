"use client";
import { useState, useTransition } from "react";
import { addProphecyAction } from "@/actions/prophecies";
import { MemberPicker } from "@/components/MemberPicker";
import { useMembers } from "@/components/MembersProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { STRINGS } from "@/lib/content/strings";
import { type MemberId, memberList, nameOf } from "@/lib/members";
import { PARCHMENT } from "@/lib/parchment";
import { PROPHECY_MAX } from "@/lib/repo/prophecies";

export function ProphecyForm({ me }: { me: MemberId }) {
  const [about, setAbout] = useState<MemberId>(me);
  const members = useMembers();
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  return (
    <div
      className={`flex flex-col gap-3 rounded-card border-[3px] border-[#c9b48a] p-4 ${PARCHMENT.panel}`}
    >
      <MemberPicker
        options={memberList(members)}
        value={about}
        onChange={setAbout}
        label={STRINGS.prophecies.about}
      />
      <Field
        placeholder={STRINGS.prophecies.line(nameOf(members, about))}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={PROPHECY_MAX}
      />
      <Button
        kind="primary"
        disabled={pending || body.trim().length === 0}
        onClick={() =>
          start(async () => {
            await addProphecyAction({ about, body });
            setBody("");
          })
        }
      >
        {STRINGS.prophecies.seal}
      </Button>
    </div>
  );
}
