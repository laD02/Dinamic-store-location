import { useState } from "react";
import styles from "../../css/tagsSection.module.css";

interface TagsSectionProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  checkDirty: () => void;
}

const SUGGESTED_TAGS = [
  "Showroom",
  "Flagship",
  "Retail Store",
  "Outlet",
  "Pickup Point",
  "Express",
  "Service Center",
  "Warehouse",
  "Pop-up Shop",
];

export default function TagsSection({
  tags,
  onTagsChange,
  checkDirty,
}: TagsSectionProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onTagsChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <s-section>
      <s-stack gap="base">
        <s-stack direction="inline" justifyContent="space-between" alignItems="center">
          <s-heading>Tags</s-heading>
        </s-stack>

        <s-stack gap="small-400">
          <div className={styles.tagContainer}>
            {tags.length > 0 ? (
              tags.map((tag, index) => (
                <div key={`${tag}-${index}`} className={styles.tagPill}>
                  <span>{tag}</span>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeTag(index)}
                    aria-label={`Remove ${tag}`}
                  >
                    <i className="fa-solid fa-xmark" style={{ fontSize: '10px' }}></i>
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>No tags added yet.</div>
            )}
            
            <div className={styles.inputWrapper}>
              <s-stack direction="inline" gap="small-200" alignItems="center">
                <div style={{ flex: 1 }} onKeyDown={(e: any) => handleKeyDown(e)}>
                  <s-text-field
                    placeholder="Add a tag..."
                    value={inputValue}
                    onInput={(e: any) => setInputValue(e.target.value)}
                  />
                </div>
                <s-button 
                  variant="secondary" 
                  onClick={() => addTag(inputValue)}
                  disabled={!inputValue.trim()}
                >
                  Add
                </s-button>
              </s-stack>
            </div>
          </div>

          <div className={styles.suggestedSection}>
            <div className={styles.suggestedTitle}>Suggested Tags</div>
            <div className={styles.suggestedTags}>
              {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map((tag) => (
                <div
                  key={tag}
                  className={styles.suggestedTag}
                  onClick={() => addTag(tag)}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: '6px', fontSize: '10px' }}></i>
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </s-stack>
      </s-stack>
    </s-section>
  );
}
