// A visually-hidden `<input type="file">` nested in a `<label>` works fine for
// mouse clicks (native label-for-control association) but is unreachable by
// keyboard: the label itself has no tab stop, so Tab skips straight over it.
// Spread this onto the label to make it a real keyboard control that opens the
// same file picker on Enter/Space.
export function fileLabelA11yProps(inputRef) {
  return {
    role: 'button',
    tabIndex: 0,
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
  };
}
