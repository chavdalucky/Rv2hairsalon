import re
with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Let's remove UpcomingAppointment from its current location
content = content.replace("        <UpcomingAppointment />\n", "")

# Let's put UpcomingAppointment directly inside the motion.div before the Premium Salon badge
new_placement = """        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pt-20 flex flex-col items-center">
          <UpcomingAppointment />
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-500/30 bg-black/40 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(245,158,11,0.1)]">"""

content = content.replace("""        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pt-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUpVariant} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-500/30 bg-black/40 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(245,158,11,0.1)]">""", new_placement)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
print("Updated Home.tsx")
