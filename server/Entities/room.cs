using System;
using System.Collections.Generic;

namespace server.Entities;

public partial class room
{
    public string id { get; set; } = null!;

    public string name { get; set; } = null!;

    public string created_by { get; set; } = null!;

    public virtual ICollection<message> messages { get; set; } = new List<message>();

    public virtual ICollection<user> users { get; set; } = new List<user>();
}
