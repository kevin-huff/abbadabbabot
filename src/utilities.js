function rand(min, max) {
    return (
      (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) %
        (max - min + 1)) +
      min
    );
  } 
  
  // Helper function to format time
  function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
  
    let timeString = "";
    if (days > 0) timeString += `${days} days `;
    if ((hours %= 24) > 0) timeString += `${hours} hours `;
    if ((minutes %= 60) > 0) timeString += `${minutes} minutes `;
    if ((seconds %= 60) > 0) timeString += `${seconds} seconds `;
  
    return timeString;
  }

  export { rand, formatTime };