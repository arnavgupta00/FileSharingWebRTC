import Dropdown from "@/components/dropdown/dropdown";


export default function Navbar() {
    return (
        <nav style={{ height: '1px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
                {/* Logo */}
            </div>
            <div className='dropdown' style={{ marginTop: "90px" }}>
                <Dropdown userName="Arnav" />
            </div>
        </nav>
    )
}