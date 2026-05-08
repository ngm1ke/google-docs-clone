export const getAvatarColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 70%, 45%)`;
};

export const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const generateSession = () => {
  const animals = [
    'Panda',
    'Koala',
    'Fox',
    'Rabbit',
    'Otter',
    'Sloth',
    'Tiger',
    'Penguin',
  ];
  const colors = [
    'Happy',
    'Clever',
    'Swift',
    'Bright',
    'Cozy',
    'Jolly',
    'Calm',
    'Silly',
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

  return {
    clientId: 'client_' + Math.random().toString(36).substr(2, 9),
    username: `${randomColor} ${randomAnimal}`,
  };
};