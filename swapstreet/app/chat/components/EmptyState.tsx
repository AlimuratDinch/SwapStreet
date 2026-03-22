import styles from "../ChatLayout.module.css";

export default function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyStateText}>
        Select a conversation to start chatting
      </p>
    </div>
  );
}
